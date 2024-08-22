import { Box, Button, colors, Container, TextField, Typography } from '@mui/material'
import React from 'react'

export default function AgentWizard() {
  return (
    <Container maxWidth="sm" sx={
      {
      marginTop: 8,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      }
    }>
      <Typography variant="h2">New Agent*</Typography>
      <Box sx={{ mt: 4,padding:5,borderRadius:2,display:"flex",flexDirection:"column", justifyContent:"start",alignItems:"flex-start" }} bgcolor={colors.lightBlue[50]}>
        <Typography variant="h5" sx={{color:"black"}}>Select a Platform</Typography>
        <Typography variant="body1" sx={{color:"black"}}>Choose the platform you want to install the agent on.</Typography>
        <Box sx={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          marginTop: 2,
          
        }}>
          <Box sx={{
          marginRight: 2,
            paddingX: 2,
            paddingY: 2,
            borderRadius: 2,
            bgcolor: colors.lightBlue[200],

          }}>
            <Typography variant="h6">Linux</Typography>
            <Typography variant="p" sx={{
              fontSize: 14
            }}>Install the agent on a Linux machine.</Typography>
          </Box>
          <Box sx={{
          marginRight: 2,
            paddingX: 2,
            paddingY: 2,
            borderRadius: 2,
            bgcolor: colors.lightBlue[200],

          }}>
            <Typography variant="h6">Windows</Typography>
            <Typography variant="p" sx={{
              fontSize: 14
            }}>Install the agent on a Windows machine.</Typography>
          </Box>
          <Box sx={{
          marginRight: 2,
            paddingX: 2,
            paddingY: 2,
            borderRadius: 2,
            bgcolor: colors.lightBlue[200],

          }}>
            <Typography variant="h6">Mac</Typography>
            <Typography variant="p" sx={{
              fontSize: 14
            }}>Install the agent on a Mac machine.</Typography>
          </Box>
        </Box>
        <Box sx={{ mt: 4, borderRadius: 2 }} >
        <Typography variant="h5" sx={{ color: "black",textAlign:"left" }}>Enter Agent Name</Typography>
        <Typography variant="body1" sx={{color:"black"}}>Enter the name of the machine you want to install the agent on.</Typography>

        <TextField
          fullWidth 
          label="Agent Name" 
          // value={agentIP} 
          // onChange={(e) => setAgentIP(e.target.value)}
          sx={{marginTop:2,
            label: { color: "black" },
            input: { color: "black" },
           
          }}
        />
      </Box>
        <Box sx={{ mt: 4, borderRadius: 2 }} >
        <Typography variant="h5" sx={{ color: "black",textAlign:"left" }}>Enter Agent IP Address</Typography>
        <Typography variant="body1" sx={{color:"black"}}>Enter the IP address of the machine you want to install the agent on.</Typography>

        <TextField
          fullWidth 
          label="Agent IP" 
          // value={agentIP} 
          // onChange={(e) => setAgentIP(e.target.value)}
          sx={{marginTop:2,
            label: { color: "black" },
            input: { color: "black" },
           
          }}
        />
      </Box>
          <Box sx={{ mt: 4, borderRadius: 2 }} >
        <Typography variant="body1" sx={{color:"black"}}>Copy the following command and run it on the machine you want to install the agent on.</Typography>
        <Box sx={{
          padding: 2,
          borderRadius: 2,
          bgcolor: colors.lightBlue[200],
          marginTop: 2,
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <Typography variant="p" >curl -sSL https://get.agent.com | bash</Typography
          >
          </Box>
          <Button variant="contained" sx={{marginTop:2}}>Finish</Button>
            </Box>
        </Box>
        
      </Container>
  )
}
