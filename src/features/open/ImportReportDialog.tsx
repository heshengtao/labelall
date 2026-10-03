import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemText,
  Typography,
} from '@mui/material'
import { useTranslation } from 'react-i18next'

import { useDatasetStore } from '@/store/datasetStore'

/**
 * MD3 dialog that explains an import: either why it failed, or exactly what a
 * tolerant reader skipped. Never uses a native alert.
 */
export function ImportReportDialog() {
  const { t } = useTranslation()
  const report = useDatasetStore((state) => state.report)
  const setReport = useDatasetStore((state) => state.setReport)

  const isError = report?.severity === 'error'

  return (
    <Dialog open={report !== null} onClose={() => setReport(null)} maxWidth="sm" fullWidth>
      <DialogTitle>{isError ? t('report.errorTitle') : t('report.warningTitle')}</DialogTitle>
      <DialogContent>
        <Alert severity={isError ? 'error' : 'warning'} sx={{ mb: 2 }}>
          {isError ? t('report.errorHint') : t('report.warningHint')}
        </Alert>
        <List dense disablePadding>
          {(report?.messages ?? []).map((message, index) => (
            <ListItem key={`${index}-${message}`} disableGutters sx={{ py: 0.25 }}>
              <ListItemText primary={<Typography variant="body2">{`• ${message}`}</Typography>} />
            </ListItem>
          ))}
        </List>
      </DialogContent>
      <DialogActions>
        <Button variant="contained" onClick={() => setReport(null)}>
          {t('common.ok')}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
