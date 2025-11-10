# Peeak Email Templates

Professional, responsive email templates for Supabase authentication flows, designed to match the Peeak brand identity.

## Templates Included

1. **confirm-signup.html** - Welcome email with signup confirmation
2. **invite.html** - Invitation to join the platform
3. **magic-link.html** - Passwordless login link
4. **change-email.html** - Email address change confirmation
5. **reset-password.html** - Password reset request
6. **reauthentication.html** - Security verification code

## Design Features

- **Brand Aligned**: Matches Peeak's minimal, clean aesthetic
- **Mobile Responsive**: Optimized for all screen sizes
- **Email Client Compatible**: Uses inline CSS and table-based layouts
- **Accessible**: Proper semantic HTML and color contrast
- **Professional**: Clean typography with Inter font family

## Color Palette

- Primary: `#737373` (Gray)
- Background: `#ffffff` (White)
- Text: `#0a0a0a` (Near Black)
- Muted: `#717171` (Gray)
- Border: `#e5e5e5` (Light Gray)

## Usage with Supabase

1. Go to your Supabase Dashboard
2. Navigate to Authentication → Email Templates
3. Select the template you want to customize
4. Copy the HTML from the corresponding file
5. Paste into the Supabase template editor
6. Save changes

## Template Variables

These templates use Supabase's template variables:

- `{{ .ConfirmationURL }}` - Action link for the user
- `{{ .Email }}` - Current email address
- `{{ .NewEmail }}` - New email address (for change email)
- `{{ .Token }}` - Verification code (for reauthentication)
- `{{ .SiteURL }}` - Your site URL

## Customization

To customize these templates:

1. Update the brand name "Peeak" to your brand
2. Adjust colors to match your brand palette
3. Modify copy to match your brand voice
4. Add your logo by replacing the text header with an image

## Testing

Test your email templates across different email clients:
- Gmail (Desktop & Mobile)
- Outlook (Desktop & Web)
- Apple Mail (Desktop & Mobile)
- Yahoo Mail
- ProtonMail

## Support

For issues or questions about these templates, please refer to the Supabase documentation on email templates.
