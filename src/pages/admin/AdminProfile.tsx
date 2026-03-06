/**
 * Admin Profile Page — reuses the same Profile component
 * Just re-exports with the admin context active.
 */

// Admin profile is identical to user profile (change password, avatar, theme, delete account)
// We simply re-export the Profile page. The Navbar already shows the Admin badge.
export { default } from '@/pages/Profile'
