import LoginLogsTable from '@/features/auditoria/components/LoginLogsTable'
import { Grid } from '@mui/material'

export default function LoginLogsPage() {
  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <LoginLogsTable />
      </Grid>
    </Grid>
  )
}
