import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../dist/public')));

const externalUrl = process.env.EXTERNAL_URL || null;
const port = externalUrl && process.env.PORT ? parseInt(process.env.PORT) : 8080;

app.get('/', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, 'index.html'));
})

app.use((req, res) => {
    res.redirect('/');
});

if (externalUrl) {
    const hostname = '0.0.0.0';
    app.listen(port, hostname, () => {
        console.log(`Server running locally at http://${hostname}:${port}/`);
        console.log(`Also available from outside via ${externalUrl}`);
    });
} else {
    app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}/`);
    });
}