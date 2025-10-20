import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase';
import { authenticateToken, requireSuperAdmin, AuthRequest } from '../middleware/auth';

const router = Router();

// Get all users (super admin only)
router.get('/', authenticateToken, requireSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, username, email, updated_at');

    if (profilesError) throw profilesError;

    const { data: roles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('user_id, role');

    if (rolesError) throw rolesError;

    const users = profiles.map(profile => {
      const userRole = roles.find(r => r.user_id === profile.id);
      return {
        ...profile,
        role: userRole?.role || 'user'
      };
    });

    res.json(users);
  } catch (error: any) {
    console.error('Get users error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update user role (super admin only)
router.patch('/:userId/role', authenticateToken, requireSuperAdmin, async (req: AuthRequest, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    // Prevent self-role change
    if (userId === req.user!.id) {
      return res.status(403).json({ error: 'Cannot change your own role' });
    }

    const { error } = await supabaseAdmin
      .from('user_roles')
      .update({ role })
      .eq('user_id', userId);

    if (error) throw error;

    res.json({ message: 'Role updated successfully' });
  } catch (error: any) {
    console.error('Update role error:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
