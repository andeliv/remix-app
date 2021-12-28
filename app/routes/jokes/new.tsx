import {
    ActionFunction,
    Form,
    json,
    Link,
    LoaderFunction,
    redirect,
    useActionData,
    useCatch, useTransition
} from "remix";
import { db } from "~/utils/db.server";
import { getUserId, requireUserId} from "~/utils/session.server";
import {JokeDisplay} from "~/components/joke";

function validateJokeContent(content: string) {
    if (content.length < 10) {
        return "Joke is too short";
    }
}

function validateJokeName(name: string) {
    if (name.length < 2) {
        return "Joke's name is too short";
    }
}

type ActionData = {
    formError?: string;
    fieldErrors?: {
        name: string | undefined;
        content: string | undefined;
    };
    fields?: {
        name: string;
        content: string;
    };
};

function badRequest(data: ActionData) {
    return json(data, { status: 400 });
}

export const action: ActionFunction = async ({ request })  => {
    const userId = await requireUserId(request);
    const form = await request.formData();
    const name = form.get("name");
    const content = form.get("content");

    if (
        typeof name !== "string" ||
        typeof content !== "string"
    ) {
        return badRequest({ formError: "Form not submitted correctly" });
    }

    const fieldErrors = {
        name: validateJokeName(name),
        content: validateJokeContent(content)
    };

    const fields = { name, content, jokesterId: userId };

    if (Object.values(fieldErrors).some(Boolean)) {
        return badRequest({ fieldErrors, fields });
    }

    const joke = await db.joke.create({ data: fields });
    return redirect(`/jokes/${joke.id}`);
};

export const loader: LoaderFunction = async ({ request }) => {
    const userId = await getUserId(request);
    
    if (!userId) {
        throw new Response('Unauthorized', {
            status: 401
        });
    }

    return {};
}

export default function PostJokeRoute() {
    const transition = useTransition();
    const actionData = useActionData<ActionData>();

    if (transition.submission) {
        const name = transition.submission.formData.get('name');
        const content = transition.submission.formData.get('content');
        if (
            typeof name === "string" &&
            typeof content === "string" &&
            !validateJokeName(name) &&
            !validateJokeContent(content)
        ) {
            const joke = { name, content };
            return (<JokeDisplay joke={joke} isOwner canDelete={false} />);
        }
    }

    return (
        <div>
            <p>Add your own hilarious joke</p>
            <Form method="post">
                <div>
                    <label>
                        Name:{" "}
                        <input
                            type="text"
                            name="name"
                            defaultValue={actionData?.fields?.name}
                            aria-invalid={Boolean(actionData?.fieldErrors?.name) || undefined}
                            aria-describedby={actionData?.fieldErrors?.name ? "name-error" : undefined}
                        />
                        {actionData?.fieldErrors?.name && (
                            <p
                                className="form-validation-error"
                                role="alert"
                                id="name-error"
                            >
                                {actionData.fieldErrors.name}
                            </p>
                        )}
                    </label>
                </div>
                <div>
                    <label>
                        Content:{" "}
                        <textarea
                            defaultValue={actionData?.fields?.content}
                            name="content"
                            aria-invalid={
                                Boolean(actionData?.fieldErrors?.content) ||
                                undefined
                            }
                            aria-describedby={
                                actionData?.fieldErrors?.content
                                    ? "content-error"
                                    : undefined
                            }
                        />
                    </label>
                    {actionData?.fieldErrors?.content ? (
                        <p
                            className="form-validation-error"
                            role="alert"
                            id="content-error"
                        >
                            {actionData.fieldErrors.content}
                        </p>
                    ) : null}
                </div>
                <div>
                    <button type="submit" className="button">Add</button>
                </div>
            </Form>
        </div>
    );
}

export function CatchBoundary() {
    const { status } = useCatch();
    if (status === 401) {
        return (
            <div className="error-container">
                <p>You must be logged in to create a joke.</p>
                <Link to="/login">Login</Link>
            </div>
        );
    }
}

export function ErrorBoundary() {
    return (
        <div className="error-container">
            Something unexpected went wrong. Sorry about that.
        </div>
    );
}
