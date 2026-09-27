require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');
const Blog = require('./models/Blog');

const port = process.env.PORT || 5000;

(async () => {
  try {
    await connectDB();

    setInterval(
      async () => {
        try {
          await Blog.updateMany(
            {
              status: 'Scheduled',
              scheduledAt: {
                $lte: new Date()
              }
            },
            {
              status: 'Published',
              publishedAt: new Date()
            }
          );
        } catch (e) {
          console.error(
            'Scheduler:',
            e.message
          );
        }
      },
      60000
    );

    app.listen(
      port,
      () =>
        console.log(
          `Server running on port ${port}`
        )
    );
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();