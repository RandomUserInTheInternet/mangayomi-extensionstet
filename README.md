# Mangayomi Extensions

Custom extension repository for the Mangayomi app.

## Available Extensions

### Anime
| Name | Language | Version | Description |
|------|----------|---------|-------------|
| Oppai Stream | English | 0.1.0 | Anime streaming source (18+/NSFW) |

## How to Install

### Option 1: Add Repository URL

Add the anime repository manually in the Mangayomi app:

**Settings → Browse → Add Repository**

```
https://raw.githubusercontent.com/RandomUserInTheInternet/mangayomi-extensionstet/main/anime_index.json
```

### Option 2: Direct Link

Click to add the repository directly:

[![Add to Mangayomi](https://img.shields.io/badge/Add%20to-Mangayomi-blue?style=for-the-badge)](https://intradeus.github.io/http-protocol-redirector?r=mangayomi://add-repo?repo_name=RandomUserInTheInternet-extensions%26repo_url=https://github.com/RandomUserInTheInternet/mangayomi-extensionstet%26anime_url=https://raw.githubusercontent.com/RandomUserInTheInternet/mangayomi-extensionstet/main/anime_index.json)

## Features

- ✅ Browse popular anime
- ✅ Browse latest updates
- ✅ Search anime
- ✅ View anime details and episodes
- ✅ Stream videos (m3u8/mp4)
- ✅ Sort by: Recent, Views, Rating, A-Z

## Extension Development

Want to create your own extension? We provide templates and comprehensive guides!

### Templates

- **[Anime Extension Template](templates/extension-template-anime.js)** - Complete template with detailed comments for creating anime/video streaming extensions
- **[Extension Development Guide](templates/EXTENSION-GUIDE.md)** - Comprehensive guide covering all aspects of extension development

### Quick Start

1. Copy the template file that matches your needs
2. Follow the step-by-step guide in EXTENSION-GUIDE.md
3. Use Mangayomi's built-in editor to test your extension
4. Submit a pull request when ready!

### What's Included

The template provides:
- ✅ Complete extension structure with metadata configuration
- ✅ All required methods with detailed comments
- ✅ Helper functions for common tasks
- ✅ Video extraction patterns (iframes, direct URLs, packed JS)
- ✅ Error handling and logging examples
- ✅ CSS selector examples

The guide covers:
- 📚 Extension structure explanation
- 📚 Required methods and their usage
- 📚 Common CSS selectors and patterns
- 📚 Video extraction techniques
- 📚 Troubleshooting common issues
- 📚 Testing workflow
- 📚 Best practices and tips

### Additional Resources

See [CONTRIBUTING-JS.md](CONTRIBUTING-JS.md) for more technical details about JavaScript extensions.

## Contributing

Feel free to contribute by opening issues or pull requests. Use our templates and guides to create new extensions!

## Disclaimer

This extension is for educational purposes only. The developer does not host any content and is not responsible for any content accessed through this extension.

## License

This project is licensed under the Apache License 2.0.
