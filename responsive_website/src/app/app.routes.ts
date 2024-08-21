import { Routes } from '@angular/router';
import { SearchComponent } from './search/search.component';
import { SearchResultComponent } from './search/search-result/search-result.component';
import { WatchlistComponent } from './watchlist/watchlist.component';
import { PortfolioComponent } from './portfolio/portfolio.component';
import { PageNotFoundComponent } from './page-not-found/page-not-found.component';

export const routes: Routes = [
    {
        path: "",
        redirectTo: "/search/home",
        pathMatch: "full"
    },
    {
        path: "search/home",
        component: SearchComponent,
        title: "Search Page"
    },
    {
        path: "search/:tickerSymbol",
        component: SearchResultComponent,
        title: "Search Result Page"
    },
    {
        path: "watchlist",
        component: WatchlistComponent,
        title: "Watchlist Page"
    },
    {
        path: "portfolio",
        component: PortfolioComponent,
        title: "Portfolio Page"
    },
    {
        path: "**",
        component: PageNotFoundComponent,
        title: "Page Not Found"
    }
];
export default routes;