namespace Backend;

public enum SocialPlatform
{
    Telegram = 0,
    Instagram = 1,
    TikTok = 2,
    YouTube = 3,
    Other = 99
}

public class User
{
    public int Id { get; set; }
    public long TelegramId { get; set; }
    public string Username { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;

    public ICollection<Review> Reviews { get; set; } = new List<Review>();
}

public class SocialAccount
{
    public int Id { get; set; }
    public SocialPlatform Platform { get; set; }
    public string Handle { get; set; } = string.Empty; // @ник
    public string? ExternalId { get; set; } // айдишник аккаунта на площадке (если есть)

    public double Rating { get; set; } = 1000; // Эло-подобный рейтинг
    public int ReviewsCount { get; set; }

    public ICollection<Review> Reviews { get; set; } = new List<Review>();
}

public class Review
{
    public int Id { get; set; }
    public int AuthorId { get; set; }
    public User Author { get; set; } = null!;

    public int SocialAccountId { get; set; }
    public SocialAccount SocialAccount { get; set; } = null!;

    public string Text { get; set; } = string.Empty;
    public int Impact { get; set; } // +1 или -1
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class TelegramAuthRequest
{
    public long Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public long AuthDate { get; set; }
    public string Hash { get; set; } = string.Empty;
}

public class ReviewRequest
{
    public SocialPlatform Platform { get; set; } = SocialPlatform.Telegram;
    public string Handle { get; set; } = string.Empty;
    public string? ExternalId { get; set; }
    public string Text { get; set; } = string.Empty;
    public int Impact { get; set; } // +1 или -1
}


