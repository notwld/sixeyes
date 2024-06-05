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
} from '@mui/icons-material';

const BASE_URL = 'http://localhost:5000'; // Replace with your backend URL

const FileManager = () => {
  const [files, setFiles] = useState([]);
  const [currentPath, setCurrentPath] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [dialog, setDialog] = useState({ open: false, type: '', fileName: '', newFileName: '', fileContent: '' });

  useEffect(() => {
    fetchFiles(currentPath);
  }, [currentPath]);

  const fetchFiles = async (path) => {
    try {
      const response = await axios.get(`${BASE_URL}/`, { params: { path } });
      setFiles(response.data.files);
    } catch (error) {
      console.error('Error fetching files:', error);
      setSnackbar({ open: true, message: 'Error fetching files', severity: 'error' });
    }
  };

  const handleUpload = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('path', currentPath);

      try {
        await axios.post(`${BASE_URL}/upload`, formData);
        fetchFiles(currentPath);
        setSnackbar({ open: true, message: 'File uploaded successfully', severity: 'success' });
      } catch (error) {
        console.error('Error uploading file:', error);
        setSnackbar({ open: true, message: 'Error uploading file', severity: 'error' });
      }
    }
  };

  const handleDelete = async (fileName) => {
    try {
      await axios.post(`${BASE_URL}/delete`, { path: currentPath, filename: fileName });
      fetchFiles(currentPath);
      setSnackbar({ open: true, message: 'File deleted successfully', severity: 'success' });
    } catch (error) {
      console.error('Error deleting file:', error);
      setSnackbar({ open: true, message: 'Error deleting file', severity: 'error' });
    }
  };

  const handleRename = async () => {
    const { fileName, newFileName } = dialog;
    try {
      await axios.post(`${BASE_URL}/rename`, { path: currentPath, old_name: fileName, new_name: newFileName });
      fetchFiles(currentPath);
      setDialog({ open: false, type: '', fileName: '', newFileName: '' });
      setSnackbar({ open: true, message: 'File renamed successfully', severity: 'success' });
    } catch (error) {
      console.error('Error renaming file:', error);
      setSnackbar({ open: true, message: 'Error renaming file', severity: 'error' });
    }
  };

  const handleCreateFile = async () => {
    const { fileName, fileContent } = dialog;
    try {
      await axios.post(`${BASE_URL}/create_file`, { path: currentPath, file_name: fileName, file_content: fileContent });
      fetchFiles(currentPath);
      setDialog({ open: false, type: '', fileName: '', fileContent: '' });
      setSnackbar({ open: true, message: 'File created successfully', severity: 'success' });
    } catch (error) {
      console.error('Error creating file:', error);
      setSnackbar({ open: true, message: 'Error creating file', severity: 'error' });
    }
  };

  const handleEditFile = async () => {
    const { fileName, fileContent } = dialog;
    try {
      await axios.post(`${BASE_URL}/create_file`, { path: currentPath, file_name: fileName, file_content: fileContent });
      fetchFiles(currentPath);
      setDialog({ open: false, type: '', fileName: '', fileContent: '' });
      setSnackbar({ open: true, message: 'File edited successfully', severity: 'success' });
    } catch (error) {
      console.error('Error editing file:', error);
      setSnackbar({ open: true, message: 'Error editing file', severity: 'error' });
    }
  };

  const handleFileClick = async (file) => {
    if (file.type === 'directory') {
      setCurrentPath(currentPath ? `${currentPath}/${file.name}` : file.name);
    } else {
      try {
        const response = await axios.post(`${BASE_URL}/get_content`, { path: currentPath, filename: file.name });
        setDialog({ open: true, type: 'edit', fileName: file.name, fileContent: response.data.content });
      } catch (error) {
        console.error('Error fetching file content:', error);
        setSnackbar({ open: true, message: 'Error fetching file content', severity: 'error' });
      }
    }
  };

  const handleDownload = async (fileName) => {
    try {
      const response = await axios.get(`${BASE_URL}/download/${encodeURIComponent(currentPath + '/' + fileName)}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
    } catch (error) {
      console.error('Error downloading file:', error);
      setSnackbar({ open: true, message: 'Error downloading file', severity: 'error' });
    }
  };

  const goBack = () => {
    const pathSegments = currentPath.split('/').filter(Boolean);
    pathSegments.pop();
    setCurrentPath(pathSegments.join('/'));
  };

  const handleChangeDirectory = (event) => {
    if (event.key === 'Enter') {
      setCurrentPath(event.target.value);
    }
  };

  const renderDialog = () => (
    <Dialog open={dialog.open} onClose={() => setDialog({ open: false, type: '', fileName: '', newFileName: '', fileContent: '' })} sx={{ p: 2 ,height: '100%'}}>
      <DialogTitle>{dialog.type === 'rename' ? 'Rename File' : dialog.type === 'edit' ? 'Edit File' : 'Create New File'}</DialogTitle>
      <DialogContent sx={{width: '100%'}}>
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
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3,alignItems: 'center' }}>
      <Box sx={{ width: '100%' }}>
        <Typography variant="h4" gutterBottom>
          File Manager
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Button
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={goBack}
            sx={{ mr: 2 }}
            disabled={!currentPath}
          >
            Go Back
          </Button>
          <TextField
            label="Change Directory"
            variant="outlined"
            size="small"
            value={currentPath}
            onChange={(e) => setCurrentPath(e.target.value)}
            onKeyDown={handleChangeDirectory}
            sx={{ mr: 2 }}
          />
          <Button
            variant="contained"
            startIcon={<UploadFileIcon />}
            component="label"
            sx={{ mr: 2 }}
          >
            Upload File
            <input type="file" hidden onChange={handleUpload} />
          </Button>
          <Button
            variant="contained"
            startIcon={<CreateNewFolderIcon />}
            onClick={() => setDialog({ open: true, type: 'create', fileName: '', fileContent: '' })}
            sx={{ mr: 2 }}
          >
            Create File
          </Button>
        </Box>
        <Card>
          <CardContent>
            <List>
              {files.map((file) => (
                <ListItem key={file.name} button onClick={() => handleFileClick(file)}>
                  <ListItemIcon>{file.type === 'file' ? <FileIcon /> : <FolderIcon />}</ListItemIcon>
                  <ListItemText primary={file.name} />
                  {file.type === 'file' && (
                    <>
                      <IconButton edge="end" onClick={() => handleDownload(file.name)}>
                        <DownloadIcon />
                      </IconButton>
                      <IconButton edge="end" onClick={() => setDialog({ open: true, type: 'edit', fileName: file.name, fileContent: '' })}>
                        <EditIcon />
                      </IconButton>
                    </>
                  )}
                  
                  <IconButton edge="end" onClick={() => handleDelete(file.name)}>
                    <DeleteIcon />
                  </IconButton>
                </ListItem>
              ))}
            </List>
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
    </Box>
  );
};

export default FileManager;
