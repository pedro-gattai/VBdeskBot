# Contributing to VB Desk

Thank you for your interest in contributing to VB Desk! We welcome contributions from the community.

## 🎯 Project Goals

VB Desk aims to bring institutional-grade privacy to decentralized OTC trading on Solana through sealed-bid auctions.

## 🚀 Getting Started

### Prerequisites

- Rust 1.70+
- Node.js 18+
- Anchor CLI
- Solana CLI
- Git

### Development Setup

```bash
# Fork and clone the repository
git clone https://github.com/YOUR_USERNAME/VBdeskBot
cd VBdeskBot

# Install dependencies
npm install

# Build the project
anchor build

# Run tests
anchor test
```

## 📝 How to Contribute

### Reporting Bugs

If you find a bug, please open an issue with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Rust version, etc.)

### Suggesting Features

We welcome feature suggestions! Please open an issue with:
- Clear description of the feature
- Use case and benefits
- Implementation considerations (if applicable)

### Submitting Pull Requests

1. **Fork the repository** and create a new branch
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following our coding standards

3. **Write or update tests** for your changes

4. **Run the test suite** to ensure everything passes
   ```bash
   anchor test
   ```

5. **Commit your changes** with clear commit messages
   ```bash
   git commit -m "feat: add new auction parameter validation"
   ```

6. **Push to your fork** and submit a pull request
   ```bash
   git push origin feature/your-feature-name
   ```

## 🎨 Coding Standards

### Rust (Smart Contract)

- Follow standard Rust formatting (`cargo fmt`)
- Use meaningful variable and function names
- Add comments for complex logic
- Include error handling with custom errors
- Write comprehensive tests

### TypeScript (Frontend/Tests)

- Use TypeScript strict mode
- Follow ESLint configuration
- Use async/await for asynchronous code
- Add JSDoc comments for public APIs
- Write unit tests for utility functions

### Commit Messages

Follow conventional commits:
- `feat:` - New features
- `fix:` - Bug fixes
- `docs:` - Documentation changes
- `test:` - Test additions or modifications
- `refactor:` - Code refactoring
- `chore:` - Maintenance tasks

## 🔒 Security

### Reporting Security Issues

**DO NOT** open public issues for security vulnerabilities.

Instead, email security concerns to: [security@vbdesk.com] (or DM the project maintainer)

We will respond promptly and work with you to address the issue.

### Security Best Practices

When contributing:
- Never commit private keys or secrets
- Follow secure coding practices
- Review Solana security best practices
- Consider edge cases and attack vectors
- Add security-focused tests

## 📚 Documentation

- Update README.md if adding new features
- Update or create documentation in `/docs`
- Add inline comments for complex logic
- Update CHANGELOG.md for significant changes

## 🧪 Testing

All contributions should include appropriate tests:

### Smart Contract Tests
- Unit tests for individual instructions
- Integration tests for full auction flows
- Edge case and error condition tests
- Security-focused tests (reentrancy, overflow, etc.)

### Frontend Tests
- Component tests
- Integration tests
- E2E tests for critical user flows

## 📋 Pull Request Checklist

Before submitting your PR, ensure:

- [ ] Code follows project coding standards
- [ ] Tests are written and passing
- [ ] Documentation is updated
- [ ] Commit messages follow conventional commits
- [ ] No merge conflicts with main branch
- [ ] PR description clearly explains the changes

## 🤝 Code of Conduct

### Our Standards

- Be respectful and inclusive
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy towards others

### Unacceptable Behavior

- Harassment or discriminatory language
- Personal attacks or trolling
- Publishing others' private information
- Unprofessional conduct

## 📞 Getting Help

If you need help:
- Check existing documentation in `/docs`
- Search existing issues
- Open a new issue with your question
- Join our community discussions

## 🏆 Recognition

Contributors will be recognized in:
- CONTRIBUTORS.md file
- Release notes for significant contributions
- Project documentation

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for contributing to VB Desk!** 🚀

*Building the future of private OTC trading together.*
