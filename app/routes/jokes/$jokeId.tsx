import type { Joke } from "@prisma/client";
import {
    ActionFunction,
    Form,
    Link,
    LoaderFunction, MetaFunction,
    redirect,
    useCatch,
    useLoaderData,
    useParams
} from "remix";
import { db } from "~/utils/db.server";
import {getUserId, requireUserId} from "~/utils/session.server";
import {JokeDisplay} from "~/components/joke";

type LoaderData = {
    joke: Joke,
    isOwner: boolean
};

export const meta: MetaFunction = ({ data }) => {
    if (!data) {
        return {
            title: 'No joke',
            description: 'No joke found'
        };
    }

    return {
        title: `${data.joke.name} joke`,
        description: `Enjoy the ${data.joke.name} joke and much more`
    };
};

export const action: ActionFunction = async ({
    request,
    params
}) => {
    const form = await request.formData();
    if (form.get("_method") === "delete") {
        const userId = await requireUserId(request);
        const joke = await db.joke.findUnique({
            where: { id: params.jokeId }
        });
        if (!joke) {
            throw new Response(
                "Can't delete what does not exist",
                { status: 404 }
            );
        }
        if (joke.jokesterId !== userId) {
            throw new Response(
                "Pssh, nice try. That's not your joke",
                {
                    status: 401
                }
            );
        }
        await db.joke.delete({ where: { id: params.jokeId } });
        return redirect("/jokes");
    }
};

export const loader: LoaderFunction = async ({ request, params }): Promise<LoaderData> => {
    const joke = await db.joke.findUnique({
        where: { id: params.jokeId }
    });

    if (!joke) {
        throw new Response('What a joke! Not found.', {
            status: 404
        });
    }

    const userId = await getUserId(request);

    return {
        joke,
        isOwner: userId === joke.jokesterId
    };
};

export default function JokeRoute() {
    const { joke, isOwner } = useLoaderData<LoaderData>();

    return (
        <JokeDisplay joke={joke} isOwner={isOwner} />
    );
}

export function CatchBoundary() {
    const { status } = useCatch();
    const { jokeId } = useParams();

    switch (status) {
        case 404:
            return (
                <div className="error-container">
                    Huh? What the heck is "{jokeId}"?
                </div>
            );

        case 401:
            return (
                <div className="error-container">
                    Sorry, but {jokeId} is not your joke.
                </div>
            );

        default: {
            throw new Error(`Unhandled error: ${status}`);
        }
    }
}

export function ErrorBoundary() {
    const { jokeId } = useParams();
    return (
        <div className="error-container">
            {`There was an error loading joke ${jokeId}.`}
        </div>
    );
}
