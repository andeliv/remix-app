import type { Joke } from "@prisma/client";
import {Link, LoaderFunction, MetaFunction, useCatch, useLoaderData} from "remix";
import { db } from "~/utils/db.server";

type LoaderData = {
    joke: Joke
};

export const meta: MetaFunction = () => {
    return {
        title: "Remix: So great, it's funny!",
        description:
            "Remix jokes app. Learn Remix and laugh at the same time!"
    };
};

export const loader: LoaderFunction = async (): Promise<LoaderData> => {
    const count = await db.joke.count();
    const randomNumber = Math.floor(Math.random() * count);
    const [ randomJoke ] = await db.joke.findMany({
        take: 1,
        skip: randomNumber
    });

    if (!randomJoke) {
        throw new Response('Random joke not found', {
            status: 403
        })
    }

    return {
        joke: randomJoke
    };
};

export default function JokesIndexRoute() {
    const { joke } = useLoaderData<LoaderData>();

    return (
        <div>
            <p>Here's a random joke:</p>
            <p>{joke.content}</p>
            <Link to={joke.id}>{joke.name} Permalink</Link>
        </div>
    );
}

export function CatchBoundary() {
    const { status } = useCatch();
    if (status === 404) {
        return (
            <div className="error-container">
                There are no jokes to display.
            </div>
        );
    }

    throw new Error(`Unexpected caught response with status: ${status}`);
}

export function ErrorBoundary() {
    return (
        <div className="error-container">
            I did a whoopsies.
        </div>
    );
}
