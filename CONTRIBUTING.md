# Contributing to Aerostorm Racing Website

Thank you for your interest in contributing to the Aerostorm Racing website! This document provides guidelines and instructions for contributing.

## Getting Started

### Setting Up Your Development Environment

1. **Fork the repository** on GitHub
2. **Clone your fork**
   ```bash
   git clone https://github.com/yourusername/aerostorm-website.git
   cd aerostorm-website
   ```
3. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

### Running Locally

1. Start the backend server:
   ```bash
   python server.py
   ```
2. Open the HTML files in your browser or use a live server extension

## Code Style Guidelines

### HTML
- Use semantic HTML5 elements
- Indent with 2 spaces
- Include alt text for all images
- Use meaningful IDs and classes

### CSS
- Use Tailwind CSS utility classes when possible
- Keep custom CSS minimal
- Use consistent naming conventions (kebab-case for classes)
- Group related styles together

### JavaScript
- Use camelCase for variables and functions
- Use const by default, let when reassignment is needed
- Add comments for complex logic
- Avoid console errors in production code
- Test across multiple browsers

### Python
- Follow PEP 8 style guide
- Use meaningful variable names
- Add docstrings to functions
- Handle exceptions gracefully

## Making Changes

### Before You Start
1. **Check existing issues** - Don't duplicate work
2. **Create an issue** for features/bugs first
3. **Discuss major changes** with the team

### Development Process

1. **Create a feature branch**
   ```bash
   git checkout -b feature/descriptive-name
   ```

2. **Make your changes**
   - Commit frequently with clear messages
   - Test thoroughly in multiple browsers
   - Keep commits focused and logically separate

3. **Test your changes**
   - Test on Chrome, Firefox, Safari, and Edge
   - Test on mobile devices (iOS Safari, Android Chrome)
   - Verify the backend still works if you modified server code
   - Check the browser console for errors

4. **Update documentation** if needed
   - README.md for user-facing changes
   - Inline comments for complex code
   - API documentation if endpoints change

## Git Commit Messages

Write clear, descriptive commit messages:

```
feat: Add photo filter effects
fix: Correct camera permission error handling
docs: Update README with new API endpoints
style: Format CSS with consistent spacing
refactor: Simplify image resize logic
test: Add browser compatibility testing notes
```

## Pull Request Process

1. **Push to your fork**
   ```bash
   git push origin feature/your-feature
   ```

2. **Create a Pull Request** on GitHub
   - Include a clear title and description
   - Reference any related issues (#123)
   - Add screenshots/videos for UI changes
   - List what you tested

3. **Respond to feedback**
   - Review comments promptly
   - Make requested changes in new commits
   - Re-request review after updates

## Types of Contributions

### 🐛 Bug Fixes
- Include steps to reproduce
- Show before/after behavior
- Test on multiple browsers

### ✨ Features
- Discuss approach before major changes
- Keep in line with project goals
- Update README and documentation

### 📚 Documentation
- Fix typos and unclear explanations
- Add examples and use cases
- Update troubleshooting section

### 🎨 UI/UX Improvements
- Include mockups or screenshots
- Maintain responsive design
- Test on mobile devices

## Reporting Issues

When reporting bugs, include:

```markdown
**Environment**
- Browser: Chrome 120.0
- OS: Windows 10
- Device: Desktop / Mobile

**Expected Behavior**
What should happen?

**Actual Behavior**
What actually happened?

**Steps to Reproduce**
1. Open JoinTheGrid.html
2. Click "Open Camera"
3. ...

**Error Message** (if applicable)
Paste console error here

**Screenshots**
Add screenshots if helpful
```

## Feature Requests

Before requesting a feature:

1. **Check if it exists** - Search issues first
2. **Describe the use case** - Why is this needed?
3. **Provide examples** - Show how it should work
4. **Consider alternatives** - Are there other solutions?

## Performance Guidelines

- Optimize images before adding to repo
- Minimize network requests
- Use efficient DOM manipulation
- Test performance on slower devices/connections
- Keep Base64 image sizes reasonable

## Security Considerations

- Never commit sensitive data (API keys, passwords)
- Sanitize user input where applicable
- Test CORS configuration for security
- Keep dependencies updated
- Report security issues privately to maintainers

## Testing

### Manual Testing Checklist
- [ ] Feature works on Chrome
- [ ] Feature works on Firefox
- [ ] Feature works on Safari
- [ ] Feature works on Edge
- [ ] Feature works on mobile (iOS)
- [ ] Feature works on mobile (Android)
- [ ] No console errors
- [ ] Responsive design verified
- [ ] Camera permissions handled properly
- [ ] Backend server still functions

### Browser Tools to Use
- Chrome DevTools for debugging
- Firefox Developer Tools for compatibility
- Safari Web Inspector for iOS testing
- Edge for cross-browser testing
- Mobile device testing via remote debugging

## Questions or Need Help?

- Open a discussion on GitHub
- Contact the team through the main repository
- Check existing issues and discussions first

## Code Review Process

The maintainers will:
1. Review code quality and style
2. Verify functionality and testing
3. Check for security issues
4. Ensure documentation is complete
5. Suggest improvements if needed

Be respectful and constructive in all interactions!

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

**Thank you for contributing to Aerostorm Racing! 🏁**
