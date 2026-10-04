import { useEffect, useState } from 'react'

import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import { Box, Button, Container, Divider, Link, Stack, Typography } from '@mui/material'
import { useTranslation } from 'react-i18next'

import { normalizeLanguage } from '@/i18n'
import { loadLegal } from '@/legal'
import { leaveLegal } from '@/legal/route'
import type { LegalDocument } from '@/legal/types'
import { useLegalStore } from '@/store/legalStore'

function formatDate(iso: string, language: string): string {
  const date = new Date(`${iso}T00:00:00Z`)
  if (Number.isNaN(date.getTime())) {
    return iso
  }
  return new Intl.DateTimeFormat(language, { dateStyle: 'long', timeZone: 'UTC' }).format(date)
}

/** Full-page reader for the privacy policy and terms. */
export function LegalPage() {
  const { t, i18n } = useTranslation()
  const route = useLegalStore((state) => state.route)
  const [loaded, setLoaded] = useState<{ key: string; document: LegalDocument } | null>(null)
  const language = normalizeLanguage(i18n.resolvedLanguage ?? i18n.language)
  const key = route ? `${route}:${language}` : null

  useEffect(() => {
    if (!route || !key) {
      return
    }
    let cancelled = false
    void loadLegal(language).then((bundle) => {
      if (!cancelled) {
        setLoaded({ key, document: bundle[route] })
      }
    })
    return () => {
      cancelled = true
    }
  }, [route, language, key])

  if (!route) {
    return null
  }

  // Derived rather than reset in an effect, so switching language shows the
  // loading state until the matching translation arrives.
  const document = key && loaded?.key === key ? loaded.document : null

  return (
    <Box sx={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
      <Container maxWidth="md" sx={{ py: 3 }}>
        <Button size="small" startIcon={<ArrowBackIcon />} onClick={leaveLegal} sx={{ mb: 2 }}>
          {t('legal.back')}
        </Button>
        {document ? (
          <Stack spacing={2} component="article">
            <Typography variant="h4" component="h1" sx={{ fontWeight: 600 }}>
              {document.title}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
              {t('legal.updated', { date: formatDate(document.updatedAt, language) })}
            </Typography>
            <Divider />
            {document.sections.map((section) => (
              <Stack key={section.id} spacing={1} component="section">
                <Typography variant="h6" component="h2" sx={{ mt: 1 }}>
                  {section.heading}
                </Typography>
                {section.blocks.map((block, index) => {
                  const blockKey = `${section.id}-${index}`
                  if (block.kind === 'p') {
                    return (
                      <Typography key={blockKey} variant="body2" sx={{ color: 'text.secondary' }}>
                        {block.text}
                      </Typography>
                    )
                  }
                  if (block.kind === 'ul') {
                    return (
                      <Box key={blockKey} component="ul" sx={{ pl: 3, my: 0 }}>
                        {block.items.map((item) => (
                          <Typography
                            key={item}
                            component="li"
                            variant="body2"
                            sx={{ mb: 0.5, color: 'text.secondary' }}
                          >
                            {item}
                          </Typography>
                        ))}
                      </Box>
                    )
                  }
                  return (
                    <Stack key={blockKey} direction="row" spacing={2} sx={{ flexWrap: 'wrap' }}>
                      {block.items.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          variant="body2"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </Stack>
                  )
                })}
              </Stack>
            ))}
          </Stack>
        ) : (
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            {t('common.loading')}
          </Typography>
        )}
      </Container>
    </Box>
  )
}
