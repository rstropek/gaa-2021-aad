import { MsalInterceptorConfiguration } from "@azure/msal-angular";
import {
  BrowserCacheLocation,
  InteractionType,
  IPublicClientApplication,
  PublicClientApplication,
} from "@azure/msal-browser";
import { environment } from "src/environments/environment";

// Create a client application for a configured AAD app
// For more details see https://azuread.github.io/microsoft-authentication-library-for-js/ref/classes/_azure_msal_browser.publicclientapplication.html
export function MSALInstanceFactory(): IPublicClientApplication {
  return new PublicClientApplication({
    auth: {
      clientId: environment.aadClientId,
      authority: `https://login.microsoftonline.com/${environment.aadTenantId}`,
    },
    cache: {
      cacheLocation: BrowserCacheLocation.LocalStorage,
    },
  });
}

export function MSALInterceptorConfigFactory(): MsalInterceptorConfiguration {
  const protectedResourceMap = new Map<string, Array<string>>();

  // Define which permissions (=scopes) we need for Microsoft Graph
  protectedResourceMap.set('https://graph.microsoft.com/v1.0/', [
    'user.read',
    'User.ReadBasic.All',
  ]);

  protectedResourceMap.set(environment.customApi, [
    'api://4fac0887-b94f-4ea9-a8d3-06c7bca2a7bd/Read',
    'api://4fac0887-b94f-4ea9-a8d3-06c7bca2a7bd/Write'
  ]);

  return {
    //interactionType: InteractionType.Popup,
    interactionType: InteractionType.Redirect,
    protectedResourceMap,
  };
}
