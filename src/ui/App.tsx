import React, { useMemo, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Stack,
  Alert,
  Divider,
  Chip,
  Stepper,
  Step,
  StepLabel,
  LinearProgress,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Checkbox,
} from '@mui/material';
import StorageIcon from '@mui/icons-material/Storage';
import BackupIcon from '@mui/icons-material/Backup';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Select, MenuItem } from '@mui/material';
import { useI18n } from './i18n';

declare global {
  interface Window {
    api?: {
      testConnection: (payload: { server: string; user: string; password: string }) => Promise<{ ok: boolean; error?: string; info?: { productVersion?: string; productLevel?: string; edition?: string; year?: string } }>
      listDatabases: (payload: { server: string; user: string; password: string }) => Promise<{ ok: boolean; databases?: string[]; error?: string }>
      backupDatabases: (payload: { server: string; user: string; password: string; databases: string[]; folder: string }) => Promise<{ ok: boolean; results?: { db: string; ok: boolean; file?: string; error?: string }[]; error?: string }>
      selectFolder: () => Promise<{ ok: boolean; folder?: string }>
    }
  }
}

const steps = ['Bağlantı', 'Veritabanları', 'Hedef Klasör', 'Yedekleme'];

type Order = 'asc' | 'desc';

export default function App() {
  const [server, setServer] = useState('');
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [activeStep, setActiveStep] = useState(0);

  const [testing, setTesting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [databases, setDatabases] = useState<string[]>([]);
  const [filter, setFilter] = useState('');
  const filtered = useMemo(() =>
    databases.filter(d => d.toLowerCase().includes(filter.toLowerCase())),
    [databases, filter]
  );

  const [selected, setSelected] = useState<string[]>([]);
  const [folder, setFolder] = useState('');
  const [backingUp, setBackingUp] = useState(false);
  const [results, setResults] = useState<{ db: string; ok: boolean; file?: string; error?: string }[]>([]);
  const [serverInfo, setServerInfo] = useState<{ productVersion?: string; productLevel?: string; edition?: string; year?: string } | null>(null);
  const { t, lang, setLang } = useI18n();
  const stepsLabels = useMemo(() => [t('steps.connection'), t('steps.databases'), t('steps.target'), t('steps.backup')], [lang]);

  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<'name'>('name');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const canTest = server.trim() && user.trim() && password.trim();

  async function handleTest() {
    setTesting(true);
    setError(null);
    setConnected(false);
    setDatabases([]);
    setSelected([]);
    try {
      const res = await window.api?.testConnection({ server, user, password });
      if (res?.ok) {
        setServerInfo(res.info || null);
        setConnected(true);
        setActiveStep(1);
        const dbs = await window.api?.listDatabases({ server, user, password });
        if (dbs?.ok && dbs.databases) setDatabases(dbs.databases);
        else setError(t('errors.dbListFail'));
      } else {
        setError(res?.error || t('errors.connectionFail'));
      }
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setTesting(false);
    }
  }

  async function pickFolder() {
    const res = await window.api?.selectFolder();
    if (res?.ok && res.folder) {
      setFolder(res.folder);
      setActiveStep(3);
    }
  }

  async function handleBackup() {
    setBackingUp(true);
    setResults([]);
    try {
      const res = await window.api?.backupDatabases({ server, user, password, databases: selected, folder });
      if (res?.ok && res.results) setResults(res.results);
      else setError(res?.error || t('errors.backupFailed'));
    } catch (e: any) {
      setError(e?.message || String(e));
    } finally {
      setBackingUp(false);
    }
  }

  function handleRequestSort() {
    const isAsc = orderBy === 'name' && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
  }

  const sorted = useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => order === 'asc' ? a.localeCompare(b) : b.localeCompare(a));
    return arr;
  }, [filtered, order]);

  const paged = useMemo(() => {
    const start = page * rowsPerPage;
    return sorted.slice(start, start + rowsPerPage);
  }, [sorted, page, rowsPerPage]);

  function handleSelectAllClick(checked: boolean) {
    if (checked) {
      setSelected(filtered);
      setActiveStep(2);
      return;
    }
    setSelected([]);
  }

  function handleClick(name: string) {
    const sel = selected.includes(name)
      ? selected.filter(n => n !== name)
      : [...selected, name];
    setSelected(sel);
    if (sel.length > 0) setActiveStep(2);
  }

  function isSelected(name: string) { return selected.includes(name); }

  return (
    <Box>
      {/* Üst başlık alanı */}
      <Box sx={{
        py: 6,
        background: 'linear-gradient(135deg, #0ea5e9 0%, #7c3aed 100%)',
        color: '#fff',
        mb: 4,
      }}>
        <Container maxWidth="md">
          <Stack direction="row" spacing={2} alignItems="center">
            <BackupIcon fontSize="large" />
            <Box>
              <Typography variant="h4">{t('app.title')}</Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {t('app.subtitle')}
              </Typography>
            </Box>
            <Select size="small" value={lang} onChange={(e) => setLang(e.target.value as any)} variant="outlined" sx={{ ml: 'auto', color: '#fff', minWidth: 120 }}>
              <MenuItem value="tr">{t('lang.turkish')}</MenuItem>
              <MenuItem value="en">{t('lang.english')}</MenuItem>
            </Select>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="md" sx={{ pb: 6 }}>
        {/* Adım çubuğu */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Stepper activeStep={activeStep} alternativeLabel>
              {stepsLabels.map((label, idx) => (
                <Step key={label} completed={idx < activeStep}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>
          </CardContent>
        </Card>

        {/* Bağlantı */}
        <Card elevation={4} sx={{ mb: 3 }}>
          <CardContent>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label={t('labels.server')} value={server} onChange={e => setServer(e.target.value)} fullWidth />
              <TextField label={t('labels.username')} value={user} onChange={e => setUser(e.target.value)} fullWidth />
              <TextField label={t('labels.password')} type="password" value={password} onChange={e => setPassword(e.target.value)} fullWidth />
            </Stack>
            <Stack direction="row" spacing={2} sx={{ mt: 2 }} alignItems="center">
              <Button variant="contained" color="primary" onClick={handleTest} disabled={!canTest || testing} startIcon={<CheckCircleIcon />}>
                {testing ? t('buttons.testing') : t('buttons.testConnection')}
              </Button>
              {connected && (
                <>
                  <Chip color="success" label={t('chips.connected')} />
                  {serverInfo?.year && (
                    <Chip color="info" label={`${t('labels.sqlServer')} ${serverInfo.year}${serverInfo.edition ? ` • ${serverInfo.edition}` : ''}`} />
                  )}
                </>
              )}
            </Stack>
            {testing && <LinearProgress sx={{ mt: 2 }} />}
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
            )}
          </CardContent>
        </Card>

        {/* Veritabanları */}
        <Card elevation={4} sx={{ mb: 3 }}>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <StorageIcon color="primary" />
              <Typography variant="h6">{t('sections.databases')}</Typography>
              <Chip label={`${databases.length} ${t('chips.total')}`} variant="outlined" />
            </Stack>
            {connected ? (
              <>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
                  <TextField
                    label={t('search.label')}
                    placeholder={t('search.placeholder')}
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    fullWidth
                  />
                </Stack>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell padding="checkbox">
                          <Checkbox
                            indeterminate={selected.length > 0 && selected.length < filtered.length}
                            checked={filtered.length > 0 && selected.length === filtered.length}
                            onChange={(e) => handleSelectAllClick(e.target.checked)}
                          />
                        </TableCell>
                        <TableCell sortDirection={order}>
                          <Button color="inherit" onClick={handleRequestSort}>
                            {t('table.name')}
                          </Button>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paged.map((name) => {
                        const isItemSelected = isSelected(name);
                        return (
                          <TableRow key={name} hover role="checkbox" selected={isItemSelected}>
                            <TableCell padding="checkbox">
                              <Checkbox checked={isItemSelected} onChange={() => handleClick(name)} />
                            </TableCell>
                            <TableCell>{name}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  component="div"
                  count={sorted.length}
                  page={page}
                  onPageChange={(_e, p) => setPage(p)}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                  rowsPerPageOptions={[10, 25, 50]}
                />
              </>
            ) : (
              <Alert severity="info">{t('info.needConnection')}</Alert>
            )}
          </CardContent>
        </Card>

        {/* Hedef Klasör */}
        <Card elevation={4} sx={{ mb: 3 }}>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <FolderOpenIcon color="secondary" />
              <Typography variant="h6">{t('sections.targetFolder')}</Typography>
              <Tooltip title={t('tooltip.backupInfo')}>
                <Chip label="Bilgi" variant="outlined" />
              </Tooltip>
            </Stack>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField fullWidth label={t('labels.folderPath')} value={folder} onChange={e => setFolder(e.target.value)} />
              <Button variant="outlined" onClick={pickFolder}>{t('buttons.pickFolder')}</Button>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                {t('caption.examples')}
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        {/* Yedekleme */}
        <Card elevation={4}>
          <CardContent>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
              <BackupIcon color="success" />
              <Typography variant="h6">{t('sections.backup')}</Typography>
              <Divider flexItem orientation="vertical" />
              <Chip label={`${t('chips.selected')}: ${selected.length}`} color={selected.length ? 'primary' : 'default'} />
            </Stack>
            <Stack direction="row" spacing={2}>
              <Button
                variant="contained"
                disabled={!connected || selected.length === 0 || !folder || backingUp}
                onClick={handleBackup}
              >
                {backingUp ? t('buttons.backingUp') : t('buttons.backupSelected')}
              </Button>
            </Stack>

            {backingUp && <LinearProgress sx={{ mt: 2 }} />}

            {results.length > 0 && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle1">{t('sections.results')}</Typography>
                {results.map(r => (
                  <Card key={r.db} sx={{ mt: 1 }}>
                    <CardContent>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
                        <Chip label={r.db} color={r.ok ? 'success' : 'error'} />
                        <Typography variant="body2" sx={{ flex: 1 }}>
                          {r.ok ? `OK → ${r.file}` : `HATA → ${r.error}`}
                        </Typography>
                      </Stack>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            )}
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}