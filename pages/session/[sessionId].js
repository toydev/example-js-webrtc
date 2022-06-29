import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import { useImmer } from 'use-immer'

import ArrowBackIcon from '@mui/icons-material/ArrowBack'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward'
import LanguageIcon from '@mui/icons-material/Language'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Container from '@mui/material/Container'
import ListItem from '@mui/material/ListItem'
import ListItemAvatar from '@mui/material/ListItemAvatar'
import ListItemText from '@mui/material/ListItemText'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { createTheme, ThemeProvider } from '@mui/material/styles'

import ClientSessionManager from 'webrtc/client/ClientSessionManager'

const theme = createTheme()

export default function Home() {
  const inputMessageTextField = useRef()
  const router = useRouter()
  const { sessionId } = router.query
  const [connected, setConnected] = useState(false)
  const [messages, setMessages] = useImmer([])

  const receiveMessage = (message) => {
    setMessages(messages => { messages.push({ type: 'receive', message: message }); return messages })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const message = inputMessageTextField.current.value
    if (message !== "" && ClientSessionManager.getSession(sessionId).send(message)) {
      console.log(messages)
      setMessages(messages => { messages.push({ type: 'send', message: message }); return messages })
      inputMessageTextField.current.value = ""
    }
  }

  useEffect(() => {
    if (sessionId) {
      const f = async () => {
        // セッションを開始する。
        const session = ClientSessionManager.getSession(sessionId)
        session.onmessage = (e) => { receiveMessage(e.data) }
        session.onopen = () => { console.log("open"); setConnected(true) }
        session.onclose = () => { console.log("close"); setConnected(false) }
        await session.connect()
      }
      f()
    }
  }, [sessionId])

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
            Session
          </Typography>
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
            <TextField
              inputRef={inputMessageTextField}
              margin="normal"
              required
              fullWidth
              id="message"
              label="Message"
              name="message"
              autoFocus
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={!connected}>
              話す
            </Button>
            {messages.slice(-6).map((i, index) =>
              <ListItem key={index}>
                <ListItemAvatar>
                  <Avatar>
                    {i.type == "send" ? <ArrowBackIcon /> : <ArrowForwardIcon />}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText primary={i.message} />
              </ListItem>
            )}
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  )
}
