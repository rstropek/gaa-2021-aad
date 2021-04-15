import { HttpClient, HttpParams } from "@angular/common/http";
import { Component, OnDestroy, OnInit } from "@angular/core";
import { MsalBroadcastService, MsalService } from "@azure/msal-angular";
import { AuthenticationResult, InteractionStatus } from "@azure/msal-browser";
import * as MicrosoftGraph from "@microsoft/microsoft-graph-types";
import { Subject } from "rxjs";
import { filter, takeUntil } from 'rxjs/operators';

interface IODataResult<T> {
  value: T;
}

interface IOrder {
  id: number;
  customer: string;
  revenue: number;
}

@Component({
  selector: "app-root",
  templateUrl: "app.component.html",
  styles: [],
})
export class AppComponent implements OnInit, OnDestroy {
  loggedIn = false;
  profile?: MicrosoftGraph.User;
  users?: MicrosoftGraph.User[];
  orders?: IOrder[];
  userNameFilter: string = "";
  private readonly _destroying$ = new Subject<void>();

  constructor(private authService: MsalService, private client: HttpClient, private msalBroadcastService: MsalBroadcastService) {}

  ngOnInit(): void {
    this.msalBroadcastService.inProgress$
    .pipe(
      filter((status: InteractionStatus) => status === InteractionStatus.None),
      takeUntil(this._destroying$)
    )
    .subscribe(() => {
      this.checkAccount();
    })
  }

  ngOnDestroy(): void {
    this._destroying$.next(undefined);
    this._destroying$.complete();
  }

  checkAccount() {
    this.loggedIn = this.authService.instance.getAllAccounts().length > 0;
    if (this.loggedIn) {
      let accounts = this.authService.instance.getAllAccounts();
      this.authService.instance.setActiveAccount(accounts[0]);
    }
  }

  login() {
    this.authService
      .loginRedirect();
  }

  logout() {
    this.authService.logout();
  }

  getProfile() {
    this.client
      .get<MicrosoftGraph.User>("https://graph.microsoft.com/v1.0/me")
      .subscribe((profile) => (this.profile = profile));
  }

  getUsers() {
    let params = new HttpParams().set("$top", "10");
    if (this.userNameFilter) {
      params = params.set(
        "$filter",
        `startsWith(displayName, '${this.userNameFilter}')`
      );
    }
    let url = `https://graph.microsoft.com/v1.0/users?${params.toString()}`;
    this.client
      .get<IODataResult<MicrosoftGraph.User[]>>(url)
      .subscribe((users) => (this.users = users.value));
  }

  getOrders() {
    this.client
      .get<IOrder[]>("http://localhost:5000/api/orders")
      .subscribe((orders) => (this.orders = orders));
  }
}
