export const GlobalComponent = {
    // Api Calling
    API_URL : 'http://localhost:5087',
    // API_URL : 'http://127.0.0.1:3000/',
    headerToken : {'Authorization': `Bearer ${sessionStorage.getItem('token')}`},

    // Auth Api
    AUTH_API:"http://localhost:5087/api/auth",
    // AUTH_API:"http://127.0.0.1:3000/auth/",

    

    
    // Products Api
    product:'apps/product',
    productDelete:'apps/product/',

    // Orders Api
    order:'apps/order',
    orderId:'apps/order/',

    // Customers Api
    customer:'apps/customer',
}