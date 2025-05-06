import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  TextField,
  Typography,
  Snackbar,
  Alert,
  CircularProgress,
  Divider,
  Breadcrumbs,
  Link,
} from '@mui/material';
import {
  Folder as FolderIcon,
  InsertDriveFile as FileIcon,
  Delete as DeleteIcon,
  CreateNewFolder as CreateNewFolderIcon,
  UploadFile as UploadFileIcon,
  Edit as EditIcon,
  ArrowBack as ArrowBackIcon,
  GetApp as DownloadIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';

const FileManager = ({ agentIp }) => {
  const [files, setFiles] = useState([]);
  const [currentPath, setCurrentPath] = useState('');
  const [pathHistory, setPathHistory] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [dialog, setDialog] = useState({ open: false, type: '', fileName: '', newFileName: '', fileContent: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const BASE_URL = `http://${agentIp}:3000`;

  useEffect(() => {
    fetchFiles(currentPath);
  }, [currentPath, agentIp]);

  const fetchFiles = async (path) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${BASE_URL}/`, { params: { path } });
      setFiles(response.data.files || []);
    } catch (error) {
      console.error('Error fetching files:', error);
      setError('Failed to load files. Please check your connection and try again.');
      setSnackbar({ open: true, message: 'Error fetching files', severity: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      setIsLoading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('path', currentPath);

      try {
        await axios.post(`${BASE_URL}/upload`, formData);
        fetchFiles(currentPath);
        setSnackbar({ open: true, message: 'File uploaded successfully', severity: 'success' });
      } catch (error) {
        console.error('Error uploading file:', error);
        setSnackbar({ open: true, message: `Error uploading file: ${error.response?.data?.error || error.message}`, severity: 'error' });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDelete = async (fileName) => {
    setIsLoading(true);
    try {
      await axios.post(`${BASE_URL}/delete`, { path: currentPath, filename: fileName });
      fetchFiles(currentPath);
      setSnackbar({ open: true, message: 'File deleted successfully', severity: 'success' });
    } catch (error) {
      console.error('Error deleting file:', error);
      setSnackbar({ open: true, message: `Error deleting file: ${error.response?.data?.error || error.message}`, severity: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRename = async () => {
    const { fileName, newFileName } = dialog;
    if (!newFileName) {
      setSnackbar({ open: true, message: 'Please enter a new file name', severity: 'error' });
      return;
    }
    
    setIsLoading(true);
    try {
      await axios.post(`${BASE_URL}/rename`, { path: currentPath, old_name: fileName, new_name: newFileName });
      fetchFiles(currentPath);
      setDialog({ open: false, type: '', fileName: '', newFileName: '' });
      setSnackbar({ open: true, message: 'File renamed successfully', severity: 'success' });
    } catch (error) {
      console.error('Error renaming file:', error);
      setSnackbar({ open: true, message: `Error renaming file: ${error.response?.data?.error || error.message}`, severity: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateFile = async () => {
    const { fileName, fileContent } = dialog;
    if (!fileName) {
      setSnackbar({ open: true, message: 'Please enter a file name', severity: 'error' });
      return;
    }
    
    setIsLoading(true);
    try {
      await axios.post(`${BASE_URL}/create_file`, { path: currentPath, file_name: fileName, file_content: fileContent || '' });
      fetchFiles(currentPath);
      setDialog({ open: false, type: '', fileName: '', fileContent: '' });
      setSnackbar({ open: true, message: 'File created successfully', severity: 'success' });
    } catch (error) {
      console.error('Error creating file:', error);
      setSnackbar({ open: true, message: `Error creating file: ${error.response?.data?.error || error.message}`, severity: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditFile = async () => {
    const { fileName, fileContent } = dialog;
    setIsLoading(true);
    try {
      await axios.post(`${BASE_URL}/create_file`, { path: currentPath, file_name: fileName, file_content: fileContent });
      fetchFiles(currentPath);
      setDialog({ open: false, type: '', fileName: '', fileContent: '' });
      setSnackbar({ open: true, message: 'File edited successfully', severity: 'success' });
    } catch (error) {
      console.error('Error editing file:', error);
      setSnackbar({ open: true, message: `Error editing file: ${error.response?.data?.error || error.message}`, severity: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileClick = async (file) => {
    if (file.type === 'directory') {
      const newPath = currentPath ? `${currentPath}/${file.name.replace('/', '')}` : file.name.replace('/', '');
      setPathHistory([...pathHistory, currentPath]);
      setCurrentPath(newPath);
    } else {
      setIsLoading(true);
      try {
        const response = await axios.post(`${BASE_URL}/get_content`, { path: currentPath, filename: file.name });
        setDialog({ open: true, type: 'edit', fileName: file.name, fileContent: response.data.content });
      } catch (error) {
        console.error('Error fetching file content:', error);
        setSnackbar({ open: true, message: `Error fetching file content: ${error.response?.data?.error || error.message}`, severity: 'error' });
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDownload = async (fileName) => {
    try {
      setIsLoading(true);
      const downloadPath = currentPath ? `${currentPath}/${fileName}` : fileName;
      const response = await axios.get(`${BASE_URL}/download/${encodeURIComponent(downloadPath)}`, {
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      setSnackbar({ open: true, message: 'File downloaded successfully', severity: 'success' });
    } catch (error) {
      console.error('Error downloading file:', error);
      setSnackbar({ open: true, message: `Error downloading file: ${error.response?.data?.error || error.message}`, severity: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const goBack = () => {
    if (pathHistory.length > 0) {
      const previousPath = pathHistory[pathHistory.length - 1];
      setPathHistory(pathHistory.slice(0, -1));
      setCurrentPath(previousPath);
    } else {
      // If no history, just go up one level
      const pathSegments = currentPath.split('/').filter(Boolean);
      pathSegments.pop();
      setCurrentPath(pathSegments.join('/'));
    }
  };

  const handlePathClick = (index) => {
    // Navigate to a specific path in the breadcrumb
    const pathSegments = currentPath.split('/').filter(Boolean);
    const newPath = pathSegments.slice(0, index + 1).join('/');
    setPathHistory([...pathHistory, currentPath]);
    setCurrentPath(newPath);
  };

  const refreshFiles = () => {
    fetchFiles(currentPath);
  };

  const handleChangeDirectory = (event) => {
    if (event.key === 'Enter') {
      setPathHistory([...pathHistory, currentPath]);
      setCurrentPath(event.target.value);
    }
  };

  const renderBreadcrumbs = () => {
    const pathSegments = currentPath.split('/').filter(Boolean);
    
    return (
      <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
        <Link 
          component="button" 
          variant="body1" 
          color="inherit" 
          onClick={() => {
            setPathHistory([...pathHistory, currentPath]);
            setCurrentPath('');
          }}
        >
          Home
        </Link>
        {pathSegments.map((segment, index) => (
          <Link
            key={index}
            component="button"
            variant="body1"
            color="inherit"
            onClick={() => handlePathClick(index)}
          >
            {segment}
          </Link>
        ))}
      </Breadcrumbs>
    );
  };

  const renderDialog = () => (
    <Dialog 
      open={dialog.open} 
      onClose={() => setDialog({ open: false, type: '', fileName: '', newFileName: '', fileContent: '' })} 
      fullWidth
      maxWidth="md"
    >
      <DialogTitle>{dialog.type === 'rename' ? 'Rename File' : dialog.type === 'edit' ? 'Edit File' : 'Create New File'}</DialogTitle>
      <DialogContent>
        <DialogContentText>
          {dialog.type === 'rename' ? 'Enter the new name for the file:' : 'Enter the name and content for the new file:'}
        </DialogContentText>
        <TextField
          autoFocus
          margin="dense"
          label="File Name"
          fullWidth
          value={dialog.fileName}
          onChange={(e) => setDialog({ ...dialog, fileName: e.target.value })}
          InputProps={{
            readOnly: dialog.type === 'edit',
          }}
          sx={{ mb: 2 }}
        />
        {(dialog.type === 'create' || dialog.type === 'edit') && (
          <TextField
            margin="dense"
            label="File Content"
            fullWidth
            multiline
            rows={20}
            value={dialog.fileContent}
            onChange={(e) => setDialog({ ...dialog, fileContent: e.target.value })}
          />
        )}
        {dialog.type === 'rename' && (
          <TextField
            margin="dense"
            label="New File Name"
            fullWidth
            value={dialog.newFileName}
            onChange={(e) => setDialog({ ...dialog, newFileName: e.target.value })}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setDialog({ open: false, type: '', fileName: '', newFileName: '', fileContent: '' })} color="primary">
          Cancel
        </Button>
        <Button onClick={dialog.type === 'rename' ? handleRename : dialog.type === 'edit' ? handleEditFile : handleCreateFile} color="primary">
          {dialog.type === 'rename' ? 'Rename' : dialog.type === 'edit' ? 'Save' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Typography variant="h4" gutterBottom>
        File Manager
      </Typography>
      
      {renderBreadcrumbs()}
      
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <Button
          variant="contained"
          startIcon={<ArrowBackIcon />}
          onClick={goBack}
          sx={{ mr: 2 }}
          disabled={!currentPath || isLoading}
        >
          Go Back
        </Button>
        <TextField
          label="Current Path"
          variant="outlined"
          size="small"
          value={currentPath}
          onChange={(e) => setCurrentPath(e.target.value)}
          onKeyDown={handleChangeDirectory}
          sx={{ mr: 2, flexGrow: 1 }}
        />
        <Button
          variant="contained"
          startIcon={<RefreshIcon />}
          onClick={refreshFiles}
          sx={{ mr: 2 }}
          disabled={isLoading}
        >
          Refresh
        </Button>
        <Button
          variant="contained"
          startIcon={<UploadFileIcon />}
          component="label"
          sx={{ mr: 2 }}
          disabled={isLoading}
        >
          Upload
          <input type="file" hidden onChange={handleUpload} />
        </Button>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialog({ open: true, type: 'create', fileName: '', fileContent: '' })}
          disabled={isLoading}
        >
          New File
        </Button>
      </Box>
      
      <Card sx={{ flexGrow: 1, overflow: 'auto' }}>
        <CardContent sx={{ padding: 0, '&:last-child': { paddingBottom: 0 } }}>
          {isLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="error">{error}</Typography>
              <Button 
                variant="contained" 
                sx={{ mt: 2 }} 
                onClick={refreshFiles}
                startIcon={<RefreshIcon />}
              >
                Try Again
              </Button>
            </Box>
          ) : files.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography>No files found in this directory</Typography>
            </Box>
          ) : (
            <List>
              {files.map((file, index) => (
                <React.Fragment key={file.name}>
                  <ListItem>
                    <ListItemIcon onClick={() => handleFileClick(file)} sx={{ cursor: 'pointer' }}>
                      {file.type === 'file' ? <FileIcon /> : <FolderIcon />}
                    </ListItemIcon>
                    <ListItemText 
                      primary={file.name} 
                      onClick={() => handleFileClick(file)} 
                      sx={{ cursor: 'pointer' }}
                    />
                    <Box>
                      {file.type === 'file' && (
                        <>
                          <IconButton onClick={() => handleDownload(file.name)}>
                            <DownloadIcon />
                          </IconButton>
                          <IconButton onClick={() => setDialog({ 
                            open: true, 
                            type: 'rename', 
                            fileName: file.name, 
                            newFileName: file.name 
                          })}>
                            <EditIcon />
                          </IconButton>
                        </>
                      )}
                      <IconButton onClick={() => handleDelete(file.name)}>
                        <DeleteIcon />
                      </IconButton>
                    </Box>
                  </ListItem>
                  {index < files.length - 1 && <Divider />}
                </React.Fragment>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
      
      {renderDialog()}
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ open: false, message: '', severity: 'info' })}
      >
        <Alert onClose={() => setSnackbar({ open: false, message: '', severity: 'info' })} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default FileManager;
