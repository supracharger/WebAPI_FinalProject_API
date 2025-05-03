# Visit the Site:

[VISIT THE SITE](https://webapi-finalproject-react.onrender.com)

[Site Repository](https://github.com/supracharger/WebAPI_FinalProject_REACT)


## Postman API Functions

[<img src="https://run.pstmn.io/button.svg" alt="Run In Postman" style="width: 128px; height: 32px;">](https://app.getpostman.com/run-collection/41727814-ffd3d8dd-ae1e-4784-a7ff-5c27083aca53?action=collection%2Ffork&source=rip_markdown&collection-url=entityId%3D41727814-ffd3d8dd-ae1e-4784-a7ff-5c27083aca53%26entityType%3Dcollection%26workspaceId%3D92d281e7-9dab-409a-8c66-e779278043cc#?env%5BQuaifeRobert_EnvFinal%5D=W3sia2V5IjoiSldUIiwidmFsdWUiOiIiLCJlbmFibGVkIjp0cnVlLCJ0eXBlIjoiZGVmYXVsdCIsInNlc3Npb25WYWx1ZSI6IkpXVC4uLiIsImNvbXBsZXRlU2Vzc2lvblZhbHVlIjoiSldUIGV5SmhiR2NpT2lKSVV6STFOaUlzSW5SNWNDSTZJa3BYVkNKOS5leUpwWkNJNklqWTNaRFptTURjMk1XSXdNRFk1T1dWa01EZGpaR0kzWlNJc0luVnpaWEp1WVcxbElqb2lZbUYwYldGdU1pSXNJbWxoZENJNk1UYzBOakk0TmpjME5Td2laWGh3SWpveE56UTJNamt3TXpRMWZRLjdfYlM0eERUd3UxT3ZEYTZraHFXQUppQnhHcHFBcDhGTVQ3M1dWVzBwd2ciLCJzZXNzaW9uSW5kZXgiOjB9LHsia2V5IjoidXNlcmlkIiwidmFsdWUiOiIiLCJlbmFibGVkIjp0cnVlLCJ0eXBlIjoiZGVmYXVsdCIsInNlc3Npb25WYWx1ZSI6IjY3ZDZmMDc2MWIwMDY5OWVkMDdjZGI3ZSIsImNvbXBsZXRlU2Vzc2lvblZhbHVlIjoiNjdkNmYwNzYxYjAwNjk5ZWQwN2NkYjdlIiwic2Vzc2lvbkluZGV4IjoxfSx7ImtleSI6Im9yZGVyX2lkIiwidmFsdWUiOiIiLCJlbmFibGVkIjp0cnVlLCJ0eXBlIjoiYW55Iiwic2Vzc2lvblZhbHVlIjoiNjgxNjM4NjFjNGZlZmUxOTZjYWI5OTAzIiwiY29tcGxldGVTZXNzaW9uVmFsdWUiOiI2ODE2Mzg2MWM0ZmVmZTE5NmNhYjk5MDMiLCJzZXNzaW9uSW5kZXgiOjJ9LHsia2V5IjoiaXRlbV9pZCIsInZhbHVlIjoiIiwiZW5hYmxlZCI6dHJ1ZSwidHlwZSI6ImFueSIsInNlc3Npb25WYWx1ZSI6IjY4MTUwM2Y1ZTAwMzdjZWM4YzMyOTZiYiIsImNvbXBsZXRlU2Vzc2lvblZhbHVlIjoiNjgxNTAzZjVlMDAzN2NlYzhjMzI5NmJiIiwic2Vzc2lvbkluZGV4IjozfV0=)

## Explanation

This web service Grants/ Denies IP addresses of the client. The countries are specified by the user. It also holds Orders and items for sale for the Financial Indicator App site. 

You can send a request to see if an IP address is Granted or Denied, and display, add, modify and delete granted countries.

Also, Order and items can be displayed, added, modified, and deleted.

### Create Account Sign-In
Register send the request and json body: https://webapi-finalproject-api.onrender.com/signup

Json Body Example:

<code>
{
    "name": "batman",
    "username": "batman2",
    "password": "penguin"
}
</code>

Sign-in request (be sure to save the JWT token): https://webapi-finalproject-api.onrender.com/signin

Json Body Example:

<code>
{
    "username": "batman2",
    "password": "penguin"
}
</code>


### Grant/ Deny IP Address

***NOTE:*** be sure to add you JWT token to the header for all requests. 
"Authorization": [Your JWT token from sign in]


Send GET request to: https://webapi-finalproject-api.onrender.com/geo/[Your IP Address]

Here is a list of allowed countries: https://webapi-finalproject-api.onrender.com/geo

You can add & delete the list of granted countries:
https://webapi-finalproject-api.onrender.com/geoedit/[Country Code]

### Orders

***NOTE:*** be sure to add you JWT token to the header for all requests. 
"Authorization": [Your JWT token from sign in]

GET all orders or POST order: https://webapi-finalproject-api.onrender.com/orders

Example JSON Body for POST request:

<code>
{
    "userid": "[User ID]",
    "deny": false,
    "address": "1039 Pena Ave",
    "city": "Somewhere",
    "state": "Antarctica",
    "zip": 10010,
    "items": [
        {"itemname": "TestItem", "price": 0.01},
        {"itemname": "TestItem2", "price": 10000000000}
        
    ],
    "total": 10000000000,
    "msg": "Test Message"
}
</code>

GET specific order: https://webapi-finalproject-api.onrender.com/orders/[Order Id]

Modify & Delete order: https://webapi-finalproject-api.onrender.com/orders/[Order Id]

### Items

***NOTE:*** be sure to add you JWT token to the header for all requests. 
"Authorization": [Your JWT token from sign in]

Send GET (All Items) & POST request to: https://webapi-finalproject-api.onrender.com/items

Example JSON Body for POST request:

<code>
{
    "name": "Item Test",
    "price": 50,
    "imgurl": "/myimg.png"
}
</code>

GET, Modify, & Delete item: https://webapi-finalproject-api.onrender.com/items/[Item ID]