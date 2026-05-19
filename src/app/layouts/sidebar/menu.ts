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
    link: '/'
  },
  {
    id: 1989,
    label: 'MENUITEMS.REQUEST.TEXT',
    isTitle: true,
    permission: 'requests.view'
  },
  {
    id: 1990,
    label: 'MENUITEMS.REQUEST.TEXT',
    icon: 'ri-file-list-3-line',
    isCollapsed: true,
    permission: 'requests.view',
    subItems: [
      {
        id: 1991,
        label: 'MENUITEMS.REQUEST.LIST.REQUESTS',
        link: '/admin/request/list',
        permission: 'requests.view'
      },
      {
        id: 1993,
        label: 'MENUITEMS.REQUEST.LIST.TRACK',
        link: '/admin/request/track',
        permission: 'requests.view'
      },
      {
        id: 1994,
        label: 'MENUITEMS.REQUEST.LIST.USERS',
        link: '/admin/request/users',
        permission: 'requests.view'
      }
    ]
  },
  {
    id: 180,
    label: 'MENUITEMS.EMPLOYEE_MANAGEMENT.TEXT',
    icon: 'ri-team-line',
    isCollapsed: true,
    subItems: [
      {
        id: 182,
        label: 'MENUITEMS.ADMIN.LIST.BRANCH',
        link: '/admin/branches',
        permission: 'branches.view'
      },
      {
        id: 1821,
        label: 'MENUITEMS.ADMIN.LIST.DEPARTMENT',
        link: '/admin/departments',
        permission: 'departments.view'
      },
      {
        id: 181,
        label: 'MENUITEMS.ADMIN.LIST.ROLE',
        link: '/admin/roles',
        permission: 'roles.view'
      },
      {
        id: 183,
        label: 'MENUITEMS.ADMIN.LIST.PERMISSION',
        link: '/admin/permissions',
        permission: 'permissions.view'
      },
      {
        id: 184,
        label: 'MENUITEMS.ADMIN.LIST.USER',
        link: '/admin/employees',
        permission: 'employees.view'
      }
    ]
  },
  {
    id: 2010,
    label: 'MENUITEMS.CONTACT_INFO.TEXT',
    icon: 'ri-contacts-book-2-line',
    isCollapsed: true,
    subItems: [
      {
        id: 188,
        label: 'MENUITEMS.ADMIN.LIST.COMPANYINFO',
        link: '/admin/company-info',
        permission: 'companyinfo.view'
      },
      {
        id: 189,
        label: 'MENUITEMS.ADMIN.LIST.CONTACTSALES',
        link: '/admin/contact-sales',
        permission: 'contactsales.view'
      },
      {
        id: 190,
        label: 'MENUITEMS.ADMIN.LIST.CONTACTUS',
        link: '/admin/contact-us',
        permission: 'contactus.view'
      },
      {
        id: 191,
        label: 'MENUITEMS.ADMIN.LIST.FAQ',
        link: '/admin/faq',
        permission: 'faq.view'
      },
      {
        id: 1911,
        label: 'MENUITEMS.ADMIN.LIST.PRIVACYPOLICY',
        link: '/admin/privacy-policy',
        permission: 'privacypolicy.view'
      }
    ]
  },
  {
    id: 2020,
    label: 'MENUITEMS.OFFERS_MENU.TEXT',
    icon: 'ri-price-tag-3-line',
    isCollapsed: true,
    subItems: [
      {
        id: 193,
        label: 'MENUITEMS.ADMIN.LIST.OFFER',
        link: '/admin/offers',
        permission: 'offers.view'
      },
      {
        id: 192,
        label: 'MENUITEMS.ADMIN.LIST.MEMBERSERVICE',
        link: '/admin/member-services',
        permission: 'memberservices.view'
      },
      {
        id: 1921,
        label: 'MENUITEMS.ADMIN.LIST.PACKAGES',
        link: '/admin/packages',
        permission: 'packages.view'
      }
    ]
  },
  {
    id: 2000,
    label: 'MENUITEMS.CARS_MANAGEMENT.TEXT',
    icon: 'ri-car-line',
    isCollapsed: true,
    subItems: [
      {
        id: 185,
        label: 'MENUITEMS.ADMIN.LIST.BRAND',
        link: '/admin/brands',
        permission: 'brands.view'
      },
      {
        id: 195,
        label: 'MENUITEMS.ADMIN.LIST.MODEL',
        link: '/admin/models',
        permission: 'models.view'
      },
      {
        id: 186,
        label: 'MENUITEMS.ADMIN.LIST.COLOR',
        link: '/admin/colors',
        permission: 'colors.view'
      },
      {
        id: 197,
        label: 'MENUITEMS.ADMIN.LIST.CARTYPE',
        link: '/admin/car-types',
        permission: 'types.view'
      },
      {
        id: 1981,
        label: 'MENUITEMS.ADMIN.LIST.CAR',
        link: '/admin/cars/list',
        permission: 'cars.view'
      },
      {
        id: 194,
        label: 'MENUITEMS.ADMIN.LIST.SERVICE',
        link: '/admin/services',
        permission: 'services.view'
      },
      {
        id: 187,
        label: 'MENUITEMS.ADMIN.LIST.GALLERYIMAGE',
        link: '/admin/gallery-images',
        permission: 'galleryimages.view'
      }
    ]
  }
];
