import express, { Response, Request } from 'express';
import { PrismaClient } from '@prisma/client';
import cors from 'cors';
import { config } from 'dotenv';
import { convertHourStringToMinutes } from './utils/convert-hour-string-to-minutes';
import { convertMinutesToHourString } from './utils/convert-minutes-to-hour-string';
config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const prisma = new PrismaClient();

app.get('/games', async (req: Request, res: Response) => {
  try {
    const games = await prisma.game.findMany({
      include: { _count: { select: { ads: true } } },
    });
    return res.status(200).json(games);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ message: error.message });
    }
  }
});

app.get('/games/:gameId/ads', async (req: Request, res: Response) => {
  const { gameId } = req.params;
  try {
    const ads = await prisma.ad.findMany({
      select: {
        id: true,
        name: true,
        weekDays: true,
        useVoiceChannel: true,
        yearsPlaying: true,
        hourStart: true,
        hourEnd: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      where: { gameId },
    });

    return res.status(200).json(
      ads.map(ad => {
        return {
          ...ad,
          weekDays: ad.weekDays.split(','),
          hourStart: convertMinutesToHourString(ad.hourStart),
          hourEnd: convertMinutesToHourString(ad.hourEnd),
        };
      }),
    );
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ message: error.message });
    }
  }
});

app.post('/games/:gameId/ads', async (req: Request, res: Response) => {
  const { gameId } = req.params;
  const { name, yearsPlaying, discord, weekDays, hourStart, hourEnd, useVoiceChannel } = req.body;

  try {
    const ads = await prisma.ad.create({
      data: {
        gameId,
        name,
        discord,
        weekDays: weekDays.join(','),
        hourStart: convertHourStringToMinutes(hourStart),
        hourEnd: convertHourStringToMinutes(hourEnd),
        yearsPlaying,
        useVoiceChannel,
      },
    });

    return res.status(201).json({ message: 'Anúncio criado com sucesso!', ads });
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ message: error.message });
    }
  }
});

app.get('/ads/:adId/discord', async (req: Request, res: Response) => {
  const { adId } = req.params;
  try {
    const ad = await prisma.ad.findUnique({ select: { discord: true }, where: { id: adId } });
    return res.status(200).json(ad);
  } catch (error) {
    if (error instanceof Error) {
      return res.status(400).json({ message: error.message });
    }
  }
});

const PORT = process.env.PORT;
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Servidor rodando na url/porta: ${PORT}`);
});
