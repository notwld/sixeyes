import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  colors, 
  Container, 
  TextField, 
  Typography, 
  Stepper, 
  Step, 
  StepLabel,
  Paper,
  IconButton,
  Tooltip,
  Alert,
  Snackbar
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export default function AgentWizard() {
  const [activeStep, setActiveStep] = useState(0);
  const [platform, setPlatform] = useState('Linux'); // Default to Linux
  const [agentName, setAgentName] = useState('');
  const [agentIP, setAgentIP] = useState('');
  const [masterIP, setMasterIP] = useState('');
  const [masterPort, setMasterPort] = useState('5000');
  const [copied, setCopied] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  
  const navigate = useNavigate();

  const handlePlatformSelection = (selectedPlatform) => {
    setPlatform(selectedPlatform);
  };

  const handleNext = () => {
    if (activeStep === 0 && !platform) {
      setSnackbar({ open: true, message: 'Please select a platform', severity: 'error' });
      return;
    }
    
    if (activeStep === 1) {
      if (!agentName) {
        setSnackbar({ open: true, message: 'Please enter an agent name', severity: 'error' });
        return;
      }
      if (!masterIP) {
        setSnackbar({ open: true, message: 'Please enter the master server IP', severity: 'error' });
        return;
      }
    }
    
    setActiveStep(prevStep => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep(prevStep => prevStep - 1);
  };

  const handleFinish = () => {
    navigate('/');
  };

  const getInstallScript = () => {
    switch (platform) {
      case 'Linux':
        return `# Download the agent files
mkdir -p sixeyes_agent && cd sixeyes_agent
wget -q https://raw.githubusercontent.com/notwld/sixeyes/master/agent/main.py
wget -q https://raw.githubusercontent.com/notwld/sixeyes/master/agent/terminal_server.py
wget -q https://raw.githubusercontent.com/notwld/sixeyes/master/agent/start_agent.sh
chmod +x start_agent.sh

# Start the agent
./start_agent.sh --master-ip ${masterIP} --master-port ${masterPort} --name "${agentName}"`;

      case 'Windows':
        return `# Download and unzip the agent files
mkdir sixeyes_agent
cd sixeyes_agent
curl -o main.py https://raw.githubusercontent.com/notwld/sixeyes/master/agent/main.py
curl -o terminal_server.py https://raw.githubusercontent.com/notwld/sixeyes/master/agent/terminal_server.py
pip install flask flask-socketio flask-cors psutil requests websockets python-socketio

# Start the agent (run in two separate terminals)
python main.py -i ${masterIP} -p ${masterPort} -name "${agentName}"
python terminal_server.py`;

      case 'Mac':
        return `# Download the agent files
mkdir -p sixeyes_agent && cd sixeyes_agent
curl -o main.py https://raw.githubusercontent.com/notwld/sixeyes/master/agent/main.py
curl -o terminal_server.py https://raw.githubusercontent.com/notwld/sixeyes/master/agent/terminal_server.py
curl -o start_agent.sh https://raw.githubusercontent.com/notwld/sixeyes/master/agent/start_agent.sh
chmod +x start_agent.sh

# Start the agent
./start_agent.sh --master-ip ${masterIP} --master-port ${masterPort} --name "${agentName}"`;

      default:
        return 'Platform not supported';
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getInstallScript())
      .then(() => {
        setCopied(true);
        setSnackbar({ open: true, message: 'Command copied to clipboard!', severity: 'success' });
        setTimeout(() => setCopied(false), 3000);
      })
      .catch(err => {
        setSnackbar({ open: true, message: 'Failed to copy to clipboard', severity: 'error' });
      });
  };

  const steps = ['Select Platform', 'Configure Agent', 'Install'];

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>Select a Platform</Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>Choose the platform you want to install the agent on.</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', gap: 2, justifyContent: 'center' }}>
              {['Linux', 'Windows', 'Mac'].map((plat) => (
                <Paper
                  key={plat}
                  elevation={platform === plat ? 3 : 1}
                  sx={{
                    padding: 2,
                    borderRadius: 2,
                    width: '160px',
                    cursor: 'pointer',
                    bgcolor: platform === plat ? colors.blue[50] : 'background.paper',
                    border: platform === plat ? `2px solid ${colors.blue[500]}` : 'none',
                    transition: 'all 0.3s',
                    '&:hover': {
                      bgcolor: colors.blue[50],
                      transform: 'translateY(-5px)',
                    }
                  }}
                  onClick={() => handlePlatformSelection(plat)}
                >
                  <Typography variant="h6" align="center">{plat}</Typography>
                  <Typography variant="body2" align="center">
                    {`Install on ${plat} machine`}
                  </Typography>
                </Paper>
              ))}
            </Box>
          </Box>
        );
        
      case 1:
        return (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" sx={{ mb: 3 }}>Configure Agent</Typography>
            
            <TextField
              fullWidth
              label="Agent Name"
              value={agentName}
              onChange={(e) => setAgentName(e.target.value)}
              sx={{ mb: 3 }}
              placeholder="e.g. Web Server 1"
              required
            />
            
            <Typography variant="h6" sx={{ mb: 2 }}>Master Server Settings</Typography>
            
            <TextField
              fullWidth
              label="Master Server IP"
              value={masterIP}
              onChange={(e) => setMasterIP(e.target.value)}
              sx={{ mb: 2 }}
              placeholder="e.g. 192.168.1.100"
              required
              helperText="IP address where the master server is running"
            />
            
            <TextField
              fullWidth
              label="Master Server Port"
              value={masterPort}
              onChange={(e) => setMasterPort(e.target.value)}
              sx={{ mb: 3 }}
              placeholder="5000"
              helperText="Default: 5000"
            />
          </Box>
        );
        
      case 2:
        return (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" sx={{ mb: 2 }}>Install Agent</Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              Copy and run the following commands on your {platform} machine to install and start the agent:
            </Typography>
            
            <Paper elevation={3} sx={{ p: 2, bgcolor: '#272822', position: 'relative', overflow: 'hidden' }}>
              <pre style={{ margin: 0, padding: '0.5rem', color: '#f8f8f2', whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontFamily: 'monospace', fontSize: '0.9rem', maxHeight: '300px', overflow: 'auto' }}>
                {getInstallScript()}
              </pre>
              <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                <Tooltip title={copied ? "Copied!" : "Copy to clipboard"}>
                  <IconButton 
                    onClick={copyToClipboard} 
                    sx={{ color: copied ? '#4caf50' : '#f8f8f2' }}
                  >
                    {copied ? <CheckCircleIcon /> : <ContentCopyIcon />}
                  </IconButton>
                </Tooltip>
              </Box>
            </Paper>
            
            <Alert severity="info" sx={{ mt: 3 }}>
              After running the commands, the agent will connect to the master server automatically. You can view and manage it from the dashboard.
            </Alert>
          </Box>
        );
        
      default:
        return 'Unknown step';
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h3" align="center" gutterBottom>Add New Agent</Typography>
      
      <Stepper activeStep={activeStep} sx={{ mb: 4, pt: 2 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>
      
      <Paper sx={{ p: 4, borderRadius: 2 }}>
        {renderStepContent(activeStep)}
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
            variant="outlined"
          >
            Back
          </Button>
          
          {activeStep === steps.length - 1 ? (
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleFinish}
            >
              Finish
            </Button>
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={handleNext}
            >
              Next
            </Button>
          )}
        </Box>
      </Paper>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
