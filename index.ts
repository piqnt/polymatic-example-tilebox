import { Middleware } from "polymatic";

import { Main, MainContext } from "./src/Main";

Middleware.activate(new Main(), new MainContext());
