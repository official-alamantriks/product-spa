using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Backend;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// SQLite + EF Core
builder.Services.AddDbContext<AppDbContext>(options =>
{
    var connectionString = builder.Configuration.GetConnectionString("DefaultConnection")
                          ?? "Data Source=app.db";
    options.UseSqlite(connectionString);
});

// Cookie-аутентификация
builder.Services
    .AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.Cookie.Name = "tg_auth";
        options.SlidingExpiration = true;
    });

builder.Services.AddAuthorization();

// CORS для фронтенда на Vite
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy
            .WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// OpenAPI
builder.Services.AddOpenApi();

var app = builder.Build();

// Миграции / создание БД
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
}

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseCors();
app.UseAuthentication();
app.UseAuthorization();

// Вспомогательный метод для проверки подписи Telegram Login Widget
static bool ValidateTelegramAuth(TelegramAuthRequest data, string botToken)
{
    // Telegram Login Widget validation:
    // https://core.telegram.org/widgets/login#checking-authorization
    var authData = new List<string>
    {
        $"auth_date={data.AuthDate}",
        $"first_name={data.FirstName}",
        $"id={data.Id}",
        $"last_name={data.LastName}",
        $"username={data.Username}"
    };
    authData.Sort(StringComparer.Ordinal);
    var dataCheckString = string.Join("\n", authData);

    var secretKey = SHA256.HashData(Encoding.UTF8.GetBytes(botToken));
    using var hmac = new HMACSHA256(secretKey);
    var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(dataCheckString));
    var hex = BitConverter.ToString(hash).Replace("-", "").ToLowerInvariant();

    return hex == data.Hash.ToLowerInvariant();
}

// AUTH
app.MapPost("/auth/telegram", async (TelegramAuthRequest request, AppDbContext db, HttpContext http, IConfiguration config) =>
{
    var botToken = config["Telegram:BotToken"];
    if (string.IsNullOrWhiteSpace(botToken))
    {
        return Results.Problem("Telegram:BotToken не настроен в appsettings.json");
    }

    if (!ValidateTelegramAuth(request, botToken))
    {
        return Results.Unauthorized();
    }

    var user = await db.Users.FirstOrDefaultAsync(u => u.TelegramId == request.Id);
    if (user is null)
    {
        user = new User
        {
            TelegramId = request.Id,
            Username = request.Username,
            DisplayName = $"{request.FirstName} {request.LastName}".Trim()
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();
    }

    var claims = new List<Claim>
    {
        new(ClaimTypes.NameIdentifier, user.Id.ToString()),
        new(ClaimTypes.Name, user.Username)
    };

    var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
    await http.SignInAsync(CookieAuthenticationDefaults.AuthenticationScheme, new ClaimsPrincipal(identity));

    return Results.Ok(new
    {
        user.Id,
        user.Username,
        user.DisplayName
    });
});

app.MapPost("/auth/logout", async (HttpContext http) =>
{
    await http.SignOutAsync();
    return Results.Ok();
});

app.MapGet("/me", async (HttpContext http, AppDbContext db) =>
{
    if (!http.User.Identity?.IsAuthenticated ?? true)
    {
        return Results.Unauthorized();
    }

    var idString = http.User.FindFirstValue(ClaimTypes.NameIdentifier);
    if (!int.TryParse(idString, out var userId))
    {
        return Results.Unauthorized();
    }

    var user = await db.Users.FirstOrDefaultAsync(u => u.Id == userId);
    if (user is null)
    {
        return Results.Unauthorized();
    }

    return Results.Ok(new
    {
        user.Id,
        user.Username,
        user.DisplayName
    });
});

// Поиск аккаунта по @
app.MapGet("/accounts/search", async (string handle, SocialPlatform platform, AppDbContext db) =>
{
    handle = handle.Trim();
    if (!handle.StartsWith("@"))
    {
        handle = "@" + handle;
    }

    var account = await db.SocialAccounts
        .Include(a => a.Reviews.OrderByDescending(r => r.CreatedAt).Take(10))
        .FirstOrDefaultAsync(a => a.Platform == platform && a.Handle == handle);

    if (account is null)
    {
        return Results.NotFound();
    }

    return Results.Ok(new
    {
        account.Id,
        account.Platform,
        account.Handle,
        account.ExternalId,
        account.Rating,
        account.ReviewsCount,
        Reviews = account.Reviews
            .OrderByDescending(r => r.CreatedAt)
            .Take(10)
            .Select(r => new
            {
                r.Id,
                r.Text,
                r.Impact,
                r.CreatedAt,
                Author = new { r.AuthorId }
            })
    });
});

// Оставить рецензию (только авторизованный пользователь)
app.MapPost("/reviews", async (ReviewRequest request, AppDbContext db, HttpContext http) =>
{
    if (!http.User.Identity?.IsAuthenticated ?? true)
    {
        return Results.Unauthorized();
    }

    var idString = http.User.FindFirstValue(ClaimTypes.NameIdentifier);
    if (!int.TryParse(idString, out var userId))
    {
        return Results.Unauthorized();
    }

    if (request.Impact is not (1 or -1))
    {
        return Results.BadRequest("Impact должен быть +1 или -1");
    }

    var handle = request.Handle.Trim();
    if (!handle.StartsWith("@"))
    {
        handle = "@" + handle;
    }

    var account = await db.SocialAccounts.FirstOrDefaultAsync(a =>
        a.Platform == request.Platform && a.Handle == handle);

    if (account is null)
    {
        account = new SocialAccount
        {
            Platform = request.Platform,
            Handle = handle,
            ExternalId = request.ExternalId,
            Rating = 1000,
            ReviewsCount = 0
        };
        db.SocialAccounts.Add(account);
        await db.SaveChangesAsync();
    }

    var review = new Review
    {
        AuthorId = userId,
        SocialAccountId = account.Id,
        Text = request.Text,
        Impact = request.Impact,
        CreatedAt = DateTime.UtcNow
    };

    db.Reviews.Add(review);

    // Простая логика "Эло": шаг 25 за отзыв
    const double step = 25;
    account.Rating += step * request.Impact;
    account.ReviewsCount += 1;

    await db.SaveChangesAsync();

    return Results.Ok(new
    {
        account.Id,
        account.Rating,
        account.ReviewsCount
    });
}).RequireAuthorization();

app.Run();
