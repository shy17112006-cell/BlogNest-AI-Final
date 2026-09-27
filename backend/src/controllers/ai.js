const { callGemini } = require('../services/geminiService');
const Blog = require('../models/Blog');

const clean = (t) =>
  t
    .replace(/^\s*\*#{1,6}\s*\*/gm, '')
    .replace(/^\s*[*\-+]\s*/gm, '')
    .trim();

exports.generate = async (req, res, next) => {
  try {
    const { topic, category } = req.body;

    if (!topic) {
      return res.status(422).json({
        message: 'Topic is required'
      });
    }

    const text = await callGemini(
      `Write a high-quality blog post about ${topic}. Include an introduction, useful key points and a conclusion. 300-500 words. Plain text.`
    );

    const b = await Blog.create({
      title: `Guide to ${topic}`,
      content: clean(text),
      category: category || 'Uncategorized',
      author: req.user._id,
      authorName: req.user.name,
      status: req.user.role === 'author'
        ? 'Pending Approval'
        : 'Draft'
    });

    res.status(201).json(b);
  } catch (e) {
    next(e);
  }
};

exports.summarize = async (req, res, next) => {
  try {
    if (!req.body.content) {
      return res.status(422).json({
        message: 'Content is required'
      });
    }

    res.json({
      summary: clean(
        await callGemini(
          `Summarize this blog content in a concise, easy-to-read paragraph:\n\n${req.body.content}`
        )
      )
    });
  } catch (e) {
    next(e);
  }
};

exports.faq = async (req, res, next) => {
  try {
    if (!req.body.question) {
      return res.status(422).json({
        message: 'Question is required'
      });
    }

    res.json({
      answer: clean(
        await callGemini(
          `Answer this blog/content management FAQ clearly and briefly:\n${req.body.question}`
        )
      )
    });
  } catch (e) {
    next(e);
  }
};

exports.weatherWise = async (req, res, next) => {
  try {
    if (!req.body.weather) {
      return res.status(422).json({
        message: 'Weather data is required'
      });
    }

    res.json({
      insight: clean(
        await callGemini(
          `Provide safety and activity advice based only on this supplied weather information. Do not invent live data.\n${req.body.weather}`
        )
      )
    });
  } catch (e) {
    next(e);
  }
};

exports.fitTrack = async (req, res, next) => {
  try {
    res.json({
      recommendation: clean(
        await callGemini(
          `Provide general, non-medical fitness guidance from these inputs. Avoid diagnosis or treatment advice.\n${JSON.stringify(req.body)}`
        )
      )
    });
  } catch (e) {
    next(e);
  }
};