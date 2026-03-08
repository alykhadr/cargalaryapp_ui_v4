import { MenuItem } from './menu.model';

export const MENU: MenuItem[] = [
  {
    id: 1,
    label: 'MENUITEMS.MENU.TEXT',
    isTitle: true
  },
  {
    id: 2,
    label: 'MENUITEMS.DASHBOARD.TEXT',
    icon: 'ri-dashboard-2-line',
    isCollapsed: true,
    subItems: [
      {
        id: 5,
        label: 'MENUITEMS.DASHBOARD.LIST.ECOMMERCE',
        link: '/',
        parentId: 2
      }
    ]
  },
  {
    id: 54,
    label: 'MENUITEMS.PAGES.TEXT',
    isTitle: true
  },
  {
    id: 82,
    label: 'MENUITEMS.PAGES.TEXT',
    icon: 'ri-pages-line',
    isCollapsed: true,
    subItems: [
      {
        id: 83,
        label: 'MENUITEMS.PAGES.LIST.STARTER',
        link: '/pages/starter',
        parentId: 82
      },
      {
        id: 84,
        label: 'MENUITEMS.PAGES.LIST.PROFILE',
        parentId: 82,
        subItems: [
          {
            id: 85,
            label: 'MENUITEMS.PAGES.LIST.SIMPLEPAGE',
            link: '/pages/profile',
            parentId: 84
          },
          {
            id: 86,
            label: 'MENUITEMS.PAGES.LIST.SETTINGS',
            link: '/pages/profile-setting',
            parentId: 84
          },
        ]
      },
      {
        id: 87,
        label: 'MENUITEMS.PAGES.LIST.TEAM',
        link: '/pages/team',
        parentId: 82
      },
      {
        id: 88,
        label: 'MENUITEMS.PAGES.LIST.TIMELINE',
        link: '/pages/timeline',
        parentId: 82
      },
      {
        id: 89,
        label: 'MENUITEMS.PAGES.LIST.FAQS',
        link: '/pages/faqs',
        parentId: 82
      },
      {
        id: 90,
        label: 'MENUITEMS.PAGES.LIST.PRICING',
        link: '/pages/pricing',
        parentId: 82
      },
      {
        id: 91,
        label: 'MENUITEMS.PAGES.LIST.GALLERY',
        link: '/pages/gallery',
        parentId: 82
      },
      {
        id: 92,
        label: 'MENUITEMS.PAGES.LIST.MAINTENANCE',
        link: '/pages/maintenance',
        parentId: 82
      },
      {
        id: 93,
        label: 'MENUITEMS.PAGES.LIST.COMINGSOON',
        link: '/pages/coming-soon',
        parentId: 82
      },
      {
        id: 94,
        label: 'MENUITEMS.PAGES.LIST.SITEMAP',
        link: '/pages/sitemap',
        parentId: 82
      },
      {
        id: 95,
        label: 'MENUITEMS.PAGES.LIST.SEARCHRESULTS',
        link: '/pages/search-results',
        parentId: 82
      },
      {
        id: 96,
        label: 'MENUITEMS.PAGES.LIST.PRIVACYPOLICY',
        link: '/pages/privacy-policy',
        parentId: 82
      },
      {
        id: 97,
        label: 'MENUITEMS.PAGES.LIST.TERMS&CONDITIONS',
        link: '/pages/terms-condition',
        parentId: 82
      },
      {
        id: 98,
        label: 'MENUITEMS.PAGES.LIST.BLOG',
        subItems: [
          {
            id: 85,
            label: 'MENUITEMS.PAGES.LIST.BLOGLIST',
            link: '/pages/pages-blog-list',
            parentId: 84
          },
          {
            id: 85,
            label: 'MENUITEMS.PAGES.LIST.BLOGGRID',
            link: '/pages/pages-blog-grid',
            parentId: 84
          },
          {
            id: 85,
            label: 'MENUITEMS.PAGES.LIST.BLOGOVERVIEW',
            link: '/pages/pages-blog-overview',
            parentId: 84
          }
        ]
      }
    ]
  },
  {
    id: 180,
    label: 'MENUITEMS.ADMIN.TEXT',
    icon: 'ri-account-circle-line',
    isCollapsed: true,
    subItems: [
      {
        id: 181,
        label: 'MENUITEMS.ADMIN.LIST.ROLE',
        link: '/admin/roles',
        parentId: 180,
        permission: 'roles.view'
      },
      {
        id: 182,
        label: 'MENUITEMS.ADMIN.LIST.BRANCH',
        link: '/admin/branches',
        parentId: 180,
        permission: 'branches.view'
      },
      {
        id: 1821,
        label: 'MENUITEMS.ADMIN.LIST.DEPARTMENT',
        link: '/admin/departments',
        parentId: 180,
        permission: 'departments.view'
      },
      
      {
        id: 183,
        label: 'MENUITEMS.ADMIN.LIST.PERMISSION',
        link: '/admin/permissions',
        parentId: 180,
        permission: 'permissions.view'
      },
      {
        id: 184,
        label: 'MENUITEMS.ADMIN.LIST.USER',
        link: '/admin/employees',
        parentId: 180,
        icon: 'ri-team-line',
        permission: 'employees.view'
      },
      {
        id: 185,
        label: 'MENUITEMS.ADMIN.LIST.BRAND',
        link: '/admin/brands',
        parentId: 180,
        permission: 'brands.view'
      },
      {
        id: 186,
        label: 'MENUITEMS.ADMIN.LIST.COLOR',
        link: '/admin/colors',
        parentId: 180,
        permission: 'colors.view'
      },
      {
        id: 187,
        label: 'MENUITEMS.ADMIN.LIST.GALLERYIMAGE',
        link: '/admin/gallery-images',
        parentId: 180,
        permission: 'galleryimages.view'
      },
      {
        id: 188,
        label: 'MENUITEMS.ADMIN.LIST.COMPANYINFO',
        link: '/admin/company-info',
        parentId: 180,
        permission: 'companyinfo.view'
      },
      {
        id: 189,
        label: 'MENUITEMS.ADMIN.LIST.CONTACTSALES',
        link: '/admin/contact-sales',
        parentId: 180,
        permission: 'contactsales.view'
      },
      {
        id: 190,
        label: 'MENUITEMS.ADMIN.LIST.CONTACTUS',
        link: '/admin/contact-us',
        parentId: 180,
        permission: 'contactus.view'
      },
      {
        id: 191,
        label: 'MENUITEMS.ADMIN.LIST.FAQ',
        link: '/admin/faq',
        parentId: 180,
        permission: 'faq.view'
      },
      {
        id: 192,
        label: 'MENUITEMS.ADMIN.LIST.MEMBERSERVICE',
        link: '/admin/member-services',
        parentId: 180,
        permission: 'memberservices.view'
      },
      {
        id: 193,
        label: 'MENUITEMS.ADMIN.LIST.OFFER',
        link: '/admin/offers',
        parentId: 180,
        permission: 'offers.view'
      },
      {
        id: 194,
        label: 'MENUITEMS.ADMIN.LIST.SERVICE',
        link: '/admin/services',
        parentId: 180,
        permission: 'services.view'
      },
      {
        id: 195,
        label: 'MENUITEMS.ADMIN.LIST.MODEL',
        link: '/admin/models',
        parentId: 180,
        permission: 'models.view'
      },
      {
        id: 196,
        label: 'MENUITEMS.ADMIN.LIST.CAREXTRADETAILS',
        link: '/admin/car-extra-details',
        parentId: 180,
        permission: 'carextradetails.view'
      },
      {
        id: 197,
        label: 'MENUITEMS.ADMIN.LIST.CARTYPE',
        link: '/admin/car-types',
        parentId: 180,
        permission: 'types.view'
      },
      {
        id: 198,
        label: 'MENUITEMS.ADMIN.LIST.CAR',
        icon: 'ri-car-line',
        parentId: 180,
        permission: 'cars.view',
        isCollapsed: true,
        subItems: [
          {
            id: 1981,
            label: 'Car List',
            link: '/admin/cars/list',
            parentId: 198,
            icon: 'ri-list-check-2',
            permission: 'cars.view'
          },
          {
            id: 1982,
            label: 'Create Car',
            link: '/admin/cars/create',
            parentId: 198,
            icon: 'ri-add-circle-line',
            permission: 'cars.create'
          }
        ]
      },
      {
        id: 199,
        label: 'Quotation',
        icon: 'ri-file-list-3-line',
        parentId: 180,
        isCollapsed: true,
        subItems: [
          {
            id: 1991,
            label: 'Quotation List',
            link: '/admin/quotation/list',
            parentId: 199,
            icon: 'ri-list-check-2'
          },
          {
            id: 1992,
            label: 'Create Quotation',
            link: '/admin/quotation/create',
            parentId: 199,
            icon: 'ri-add-circle-line'
          },
          {
            id: 1993,
            label: 'Track Quotation',
            link: '/admin/quotation/track',
            parentId: 199,
            icon: 'ri-route-line'
          }
        ]
      }
      
      ,
      
      
    ]
  }

];
