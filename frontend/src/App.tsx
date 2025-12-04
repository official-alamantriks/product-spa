import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import './App.css'

type Me = {
  id: number
  username: string
  displayName: string
} | null

type Review = {
  id: number
  text: string
  impact: number
  createdAt: string
  author: {
    authorId: number
  }
}

type Account = {
  id: number
  platform: number
  handle: string
  externalId?: string
  rating: number
  reviewsCount: number
  reviews: Review[]
} | null

type TelegramWidgetUser = {
  id: number
  username?: string
  first_name?: string
  last_name?: string
  auth_date: number
  hash: string
}

declare global {
  interface Window {
    onTelegramAuth?: (user: TelegramWidgetUser) => void
  }
}

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5185',
  withCredentials: true,
})

function App() {
  const [me, setMe] = useState<Me>(null)
  const [handle, setHandle] = useState('@')
  // Платформа всегда Telegram
  const [platform] = useState('Telegram')
  const [account, setAccount] = useState<Account>(null)
  const [reviewText, setReviewText] = useState('')
  const [impact, setImpact] = useState<1 | -1>(1)
  const [loadingSearch, setLoadingSearch] = useState(false)
  const [sendingReview, setSendingReview] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const tgButtonRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    API.get('/me')
      .then((r) => setMe(r.data))
      .catch(() => setMe(null))
  }, [])

  // Подключаем реальный Telegram Login Widget
  useEffect(() => {
    // Глобальный колбэк, который указали в data-onauth
    window.onTelegramAuth = async (user: TelegramWidgetUser) => {
      try {
        const payload = {
          id: user.id,
          username: (user.username ?? '').replace('@', ''),
          firstName: user.first_name ?? '',
          lastName: user.last_name ?? '',
          authDate: user.auth_date,
          hash: user.hash,
        }
        const res = await API.post('/auth/telegram', payload)
        setMe(res.data)
        setError(null)
      } catch (e) {
        console.error(e)
        setError('Не удалось войти через Telegram')
      }
    }

    // Динамически создаём скрипт-виджет в нужном месте карточки
    if (tgButtonRef.current) {
      const existing = tgButtonRef.current.querySelector('script[data-telegram-login]')
      if (!existing) {
        const script = document.createElement('script')
        script.setAttribute('src', 'https://telegram.org/js/telegram-widget.js?22')
        script.setAttribute('data-telegram-login', 'vindettaa_bot')
        script.setAttribute('data-size', 'large')
        script.setAttribute('data-userpic', 'false')
        script.setAttribute('data-request-access', 'write')
        script.setAttribute('data-onauth', 'onTelegramAuth')
        script.async = true
        tgButtonRef.current.appendChild(script)
      }
    }
  }, [])

  const logout = async () => {
    await API.post('/auth/logout')
    setMe(null)
  }

  const searchAccount = async () => {
    if (!me) {
      setError('Сначала войдите через Telegram, чтобы пользоваться поиском')
      return
    }
    if (!handle.trim()) return
    setLoadingSearch(true)
    setError(null)
    setAccount(null)
    try {
      const res = await API.get('/accounts/search', {
        params: { handle, platform },
      })
      setAccount({
        ...res.data,
        reviews: res.data.reviews ?? res.data.Reviews ?? [],
      })
    } catch (e) {
      console.error(e)
      setError('Аккаунт не найден, но будет создан при первом отзыве')
      setAccount(null)
    } finally {
      setLoadingSearch(false)
    }
  }

  const sendReview = async () => {
    if (!me) {
      setError('Нужно войти через Telegram, чтобы оставить рецензию')
      return
    }
    if (!reviewText.trim()) return
    setSendingReview(true)
    setError(null)
    try {
      const res = await API.post('/reviews', {
        platform,
        handle,
        text: reviewText,
        impact,
      })
      setReviewText('')
      // после сохранения можно заново поискать аккаунт, чтобы обновить рейтинг и список отзывов
      await searchAccount()
      setError(null)
      console.log(res.data)
    } catch (e) {
      console.error(e)
      setError('Не удалось отправить рецензию')
    } finally {
      setSendingReview(false)
    }
  }

  return (
    <div className="app-root">
      <div className="background-orbit" />
      <div className="background-gradient" />

      <motion.main
        className="shell"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <section className="left-panel">
          <motion.h1
            className="brand-title"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
          >
            Vendetta
          </motion.h1>
          <p className="brand-subtitle">
            Платформа, где репутация аккаунтов строится на реальных рецензиях,
            а рейтинг меняется по Эло-похожему принципу.
          </p>

          <motion.div
            className="auth-card glass"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="auth-header">
              <span className="pill">Авторизация</span>
              <h2>Вход через Telegram</h2>
              <p>Только зарегистрированные через Telegram пользователи могут оставлять рецензии.</p>
            </div>

            {me ? (
              <div className="auth-user">
                <div>
                  <div className="auth-name">{me.displayName || me.username}</div>
                  <div className="auth-username">@{me.username}</div>
                </div>
                <button className="btn ghost" onClick={logout}>
                  Выйти
                </button>
              </div>
            ) : (
              <div ref={tgButtonRef} className="tg-widget-container" />
            )}

            {error && <div className="error">{error}</div>}

            <div className="hint">Авторизация происходит через официальный Telegram Login Widget.</div>
          </motion.div>
        </section>

        <section className="right-panel">
          <motion.div
            className="search-card glass"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25, duration: 0.5 }}
          >
            <div className="search-header">
              <span className="pill pill-alt">Поиск</span>
              <h2>Найти аккаунт по @</h2>
            </div>

            <div className="form-row">
              <label className="field">
                <span className="label">Площадка</span>
                <input value="Telegram" readOnly />
              </label>

              <label className="field grow">
                <span className="label">@аккаунт или сообщество</span>
                <input
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="@username"
                  disabled={!me}
                />
              </label>

              <button className="btn primary" onClick={searchAccount} disabled={loadingSearch || !me}>
                {loadingSearch ? 'Поиск...' : 'Найти'}
              </button>
            </div>

            <div className="divider" />

            <div className="rating-block">
              {account ? (
                <>
                  <h3>{account.handle}</h3>
                  <div className="rating-row">
                    <div className="rating-value">
                      <span className="label">Рейтинг</span>
                      <span className="value">{Math.round(account.rating)}</span>
                    </div>
                    <div className="rating-count">
                      <span className="label">Рецензий</span>
                      <span className="value">{account.reviewsCount}</span>
                    </div>
                  </div>
                </>
              ) : (
                <p className="muted">
                  Здесь появится рейтинг аккаунта и краткая сводка по рецензиям.
                </p>
              )}
            </div>
          </motion.div>

          <motion.div
            className="review-card glass"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.5 }}
          >
            <div className="search-header">
              <span className="pill pill-alt">Рецензия</span>
              <h2>Написать отзыв</h2>
            </div>

            <label className="field">
              <span className="label">Текст рецензии</span>
              <textarea
                rows={4}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Опишите опыт: качество контента, активность, честность, общение и т.п."
                disabled={!me}
              />
            </label>

            <div className="form-row space-between">
              <div className="impact-toggle">
                <button
                  className={`impact-btn positive ${impact === 1 ? 'active' : ''}`}
                  onClick={() => setImpact(1)}
                  type="button"
                  disabled={!me}
                >
                  Повысить рейтинг
                </button>
                <button
                  className={`impact-btn negative ${impact === -1 ? 'active' : ''}`}
                  onClick={() => setImpact(-1)}
                  type="button"
                  disabled={!me}
                >
                  Понизить рейтинг
                </button>
              </div>

              <button
                className="btn primary"
                onClick={sendReview}
                disabled={sendingReview || !reviewText.trim() || !me}
              >
                {sendingReview ? 'Отправка...' : 'Отправить рецензию'}
              </button>
            </div>

            {account && account.reviews?.length > 0 && (
              <div className="reviews-list">
                <h3>Последние рецензии</h3>
                <div className="reviews-scroll">
                  {account.reviews.map((r) => (
                    <motion.article
                      key={r.id}
                      className="review-item"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="review-header">
                        <span
                          className={`badge ${r.impact === 1 ? 'badge-positive' : 'badge-negative'}`}
                        >
                          {r.impact === 1 ? '+ рейтинг' : '− рейтинг'}
                        </span>
                        <span className="review-date">
                          {new Date(r.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="review-text">{r.text}</p>
                    </motion.article>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        </section>
      </motion.main>
    </div>
  )
}

export default App
