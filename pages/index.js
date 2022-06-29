import { useRouter } from 'next/router'
import LanguageIcon from '@mui/icons-material/Language'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import Typography from '@mui/material/Typography'
import { createTheme, ThemeProvider } from '@mui/material/styles'

import ClientSessionManager from 'webrtc/client/ClientSessionManager'

const theme = createTheme()

export default function Page() {
  const router = useRouter()

  const handleSubmit = (event) => {
    event.preventDefault()
    router.push(`/session/${ClientSessionManager.getNewSessionId()}`)
  }

  return (
    <ThemeProvider theme={theme}>
      <Container component="main" maxWidth="xs">
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
            <LanguageIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Start
          </Typography>
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}>
              セッションを開始する
            </Button>
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  )
}
