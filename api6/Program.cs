using Microsoft.AspNetCore.Authorization;
using Microsoft.Identity.Web;
using Microsoft.Identity.Web.Resource;
using System.Collections.Concurrent;
using System.Security.Claims;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Add web API authentication to dependency injection.
// Note that you need to add Microsoft.Identity.Web NuGet to your
// ASP.NET Core 6 app to make that work. Docs see
// https://docs.microsoft.com/en-us/dotnet/api/microsoft.identity.web.microsoftidentitywebappservicecollectionextensions.addmicrosoftidentitywebappauthentication
builder.Services.AddMicrosoftIdentityWebApiAuthentication(builder.Configuration);

// Don't forget to add authentication and authorization to DI.
builder.Services.AddAuthentication();
builder.Services.AddAuthorization(options =>
{
    options.AddPolicy("RainerOnly", policy => policy.RequireClaim(ClaimTypes.Name, "live.com#rainer@software-architects.at"));
});

builder.Services.AddCors();

// Configure the HTTP request pipeline.
var app = builder.Build();
app.UseCors(builder => builder.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader());
app.UseHttpsRedirection();

// Add authentication and authorization middleware.
app.UseAuthentication();
app.UseAuthorization();

ConcurrentBag<Order> orders = new()
{
    new(1, "Foo", 42m),
    new(2, "Bar", 84m)
};
app.MapGet("api/orders",
    //[RequiredScope("Read")]
    //[Authorize]
    [Authorize(Policy = "RainerOnly")]
    (ClaimsPrincipal user) =>
    {
        app.Logger.LogInformation($"The user name is {user.Claims.First(c => c.Type == ClaimTypes.Name)}");
        app.Logger.LogInformation($"The AAD object ID for the user is {user.Claims.First(c => c.Type == ClaimConstants.ObjectId)}");
        return Results.Ok(orders);
    });
app.MapPost("api/orders",
    //[RequiredScope("write")]
    (Order order) =>
    {
        orders.Add(order);
        return Results.Created(string.Empty, order);
    });
app.MapPost("api/orders/clear",
    //[RequiredScope("admin")]
    () =>
    {
        orders.Clear();
        return Results.NoContent();
    });

app.Run();

public record Order(int ID, string Customer, decimal Revenue);
