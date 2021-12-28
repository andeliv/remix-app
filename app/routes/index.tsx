import { Link, LinksFunction} from "remix";
import stylesRef from "~/styles/index.css";

export const links: LinksFunction = () => [
    {
        rel: "stylesheet",
        href: stylesRef
    }
];

export default function IndexRoute() {
    return (
        <div className="container">
            <div className="content">
                <h1>
                    Remix <span>Jokes!</span>
                </h1>
                <nav>
                    <ul>
                        <li>
                            <Link to="jokes">Read Jokes</Link>
                        </li>
                        <li>
                            <Link to="jokes.rss" reloadDocument>RSS Feed</Link>
                        </li>
                    </ul>
                </nav>
            </div>
        </div>
    );
}
