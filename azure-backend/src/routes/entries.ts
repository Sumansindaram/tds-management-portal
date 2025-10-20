import { Router } from 'express';
import multer from 'multer';
import { supabaseAdmin } from '../config/supabase';
import { authenticateToken, requireAdmin, AuthRequest } from '../middleware/auth';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

// Get all entries (admin only)
router.get('/', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('tds_entries')
      .select('id, reference, short_name, nsn, ssr_name, status, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error: any) {
    console.error('Get entries error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user's own entries
router.get('/my', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('tds_entries')
      .select('id, reference, short_name, nsn, status, created_at')
      .eq('submitted_by', req.user!.id)
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data || []);
  } catch (error: any) {
    console.error('Get my entries error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get single entry
router.get('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabaseAdmin
      .from('tds_entries')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    // Check access
    const isAdmin = req.user!.role === 'admin' || req.user!.role === 'super_admin';
    if (!isAdmin && data.submitted_by !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Load comment history
    const { data: comments } = await supabaseAdmin
      .from('tds_entry_comments')
      .select('*')
      .eq('entry_id', id)
      .order('created_at', { ascending: false });

    res.json({ ...data, comments: comments || [] });
  } catch (error: any) {
    console.error('Get entry error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create entry
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const entryData = {
      ...req.body,
      submitted_by: req.user!.id,
      status: 'Pending'
    };

    const { data, error } = await supabaseAdmin
      .from('tds_entries')
      .insert(entryData)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    console.error('Create entry error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update entry status (admin only)
router.patch('/:id/status', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status, comment } = req.body;

    // Update entry
    const { error: updateError } = await supabaseAdmin
      .from('tds_entries')
      .update({ status, admin_comment: comment })
      .eq('id', id);

    if (updateError) throw updateError;

    // Add comment to history
    if (comment) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('full_name')
        .eq('id', req.user!.id)
        .single();

      await supabaseAdmin
        .from('tds_entry_comments')
        .insert({
          entry_id: id,
          admin_id: req.user!.id,
          admin_name: profile?.full_name || req.user!.email,
          status,
          comment
        });
    }

    res.json({ message: 'Status updated successfully' });
  } catch (error: any) {
    console.error('Update status error:', error);
    res.status(500).json({ error: error.message });
  }
});

// List files for an entry
router.get('/:id/files', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Get entry to check access and get NSN
    const { data: entry, error: entryError } = await supabaseAdmin
      .from('tds_entries')
      .select('submitted_by, nsn')
      .eq('id', id)
      .single();

    if (entryError) throw entryError;

    const isAdmin = req.user!.role === 'admin' || req.user!.role === 'super_admin';
    if (!isAdmin && entry.submitted_by !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // List files from both possible paths
    const transportPrefix = entry.nsn ? `${entry.nsn}/${id}` : `${entry.submitted_by}/${id}`;
    const supportPrefix = entry.nsn ? `${entry.nsn}/${id}` : `${entry.submitted_by}/${id}`;

    const { data: transportFiles } = await supabaseAdmin.storage
      .from('transportation-data')
      .list(transportPrefix);

    const { data: supportFiles } = await supabaseAdmin.storage
      .from('supporting-documents')
      .list(supportPrefix);

    res.json({
      transportation: transportFiles || [],
      supporting: supportFiles || []
    });
  } catch (error: any) {
    console.error('List files error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Upload files
router.post('/:id/files', authenticateToken, upload.array('files', 20), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { bucket, category } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files provided' });
    }

    // Get entry
    const { data: entry, error: entryError } = await supabaseAdmin
      .from('tds_entries')
      .select('submitted_by, nsn')
      .eq('id', id)
      .single();

    if (entryError) throw entryError;

    if (entry.submitted_by !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const basePath = entry.nsn ? `${entry.nsn}/${id}` : `${entry.submitted_by}/${id}`;
    const uploadPromises = files.map(async (file) => {
      const fileName = category ? `${category}_${file.originalname}` : file.originalname;
      const filePath = `${basePath}/${fileName}`;

      const { error } = await supabaseAdmin.storage
        .from(bucket)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: true
        });

      if (error) throw error;
      return fileName;
    });

    const uploadedFiles = await Promise.all(uploadPromises);
    res.json({ files: uploadedFiles });
  } catch (error: any) {
    console.error('Upload files error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Download file
router.get('/:id/files/:bucket/:filename', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id, bucket, filename } = req.params;

    // Get entry
    const { data: entry, error: entryError } = await supabaseAdmin
      .from('tds_entries')
      .select('submitted_by, nsn')
      .eq('id', id)
      .single();

    if (entryError) throw entryError;

    const isAdmin = req.user!.role === 'admin' || req.user!.role === 'super_admin';
    if (!isAdmin && entry.submitted_by !== req.user!.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Try both paths
    const paths = [
      entry.nsn ? `${entry.nsn}/${id}/${filename}` : null,
      `${entry.submitted_by}/${id}/${filename}`
    ].filter(Boolean) as string[];

    for (const path of paths) {
      const { data, error } = await supabaseAdmin.storage
        .from(bucket)
        .createSignedUrl(path, 300);

      if (!error && data) {
        return res.json({ url: data.signedUrl });
      }
    }

    res.status(404).json({ error: 'File not found' });
  } catch (error: any) {
    console.error('Download file error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
