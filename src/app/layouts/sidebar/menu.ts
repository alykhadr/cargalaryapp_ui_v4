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
    label: 'MENUITEMS.QUOTATION.TEXT',
    isTitle: true,
    permission: 'quotations.view'
  },
  {
    id: 1990,
    label: 'MENUITEMS.QUOTATION.TEXT',
    icon: 'ri-file-list-3-line',
    isCollapsed: true,
    permission: 'quotations.view',
    subItems: [
      {
        id: 1991,
        label: 'MENUITEMS.QUOTATION.LIST.QUOTATIONS',
        link: '/admin/quotation/list',
        permission: 'quotations.view'
      },
      {
        id: 1993,
        label: 'MENUITEMS.QUOTATION.LIST.TRACK',
        link: '/admin/quotation/track',
        permission: 'quotations.view'
      },
      {
        id: 1994,
        label: 'MENUITEMS.QUOTATION.LIST.USERS',
        link: '/admin/quotation/users',
        permission: 'quotations.view'
      }
    ]
  },
  {
    id: 180,
    label: 'MENUITEMS.ADMIN.TEXT',
    isTitle: true
  },
  {
    id: 182,
    label: 'MENUITEMS.ADMIN.LIST.BRANCH',
    link: '/admin/branches',
    icon: 'ri-git-branch-line',
    permission: 'branches.view'
  },
  {
    id: 1821,
    label: 'MENUITEMS.ADMIN.LIST.DEPARTMENT',
    link: '/admin/departments',
    icon: 'ri-building-4-line',
    permission: 'departments.view'
  },
  {
    id: 181,
    label: 'MENUITEMS.ADMIN.LIST.ROLE',
    link: '/admin/roles',
    icon: 'ri-shield-user-line',
    permission: 'roles.view'
  },
  {
    id: 183,
    label: 'MENUITEMS.ADMIN.LIST.PERMISSION',
    link: '/admin/permissions',
    icon: 'ri-lock-password-line',
    permission: 'permissions.view'
  },
  {
    id: 184,
    label: 'MENUITEMS.ADMIN.LIST.USER',
    link: '/admin/employees',
    icon: 'ri-team-line',
    permission: 'employees.view'
  },
  {
    id: 188,
    label: 'MENUITEMS.ADMIN.LIST.COMPANYINFO',
    link: '/admin/company-info',
    icon: 'ri-information-line',
    permission: 'companyinfo.view'
  },
  {
    id: 189,
    label: 'MENUITEMS.ADMIN.LIST.CONTACTSALES',
    link: '/admin/contact-sales',
    icon: 'ri-customer-service-2-line',
    permission: 'contactsales.view'
  },
  {
    id: 190,
    label: 'MENUITEMS.ADMIN.LIST.CONTACTUS',
    link: '/admin/contact-us',
    icon: 'ri-contacts-line',
    permission: 'contactus.view'
  },
  {
    id: 191,
    label: 'MENUITEMS.ADMIN.LIST.FAQ',
    link: '/admin/faq',
    icon: 'ri-questionnaire-line',
    permission: 'faq.view'
  },
  {
    id: 2000,
    label: 'MENUITEMS.CARS_MANAGEMENT.TEXT',
    isTitle: true
  },
  {
    id: 185,
    label: 'MENUITEMS.ADMIN.LIST.BRAND',
    link: '/admin/brands',
    icon: 'ri-award-line',
    permission: 'brands.view'
  },
  {
    id: 195,
    label: 'MENUITEMS.ADMIN.LIST.MODEL',
    link: '/admin/models',
    icon: 'ri-shapes-line',
    permission: 'models.view'
  },
  {
    id: 186,
    label: 'MENUITEMS.ADMIN.LIST.COLOR',
    link: '/admin/colors',
    icon: 'ri-palette-line',
    permission: 'colors.view'
  },
  {
    id: 196,
    label: 'MENUITEMS.ADMIN.LIST.CAREXTRADETAILS',
    link: '/admin/car-extra-details',
    icon: 'ri-file-list-3-line',
    permission: 'carextradetails.view'
  },
  {
    id: 197,
    label: 'MENUITEMS.ADMIN.LIST.CARTYPE',
    link: '/admin/car-types',
    icon: 'ri-list-check-2',
    permission: 'types.view'
  },
  {
    id: 1981,
    label: 'MENUITEMS.ADMIN.LIST.CAR',
    link: '/admin/cars/list',
    icon: 'ri-car-line',
    permission: 'cars.view'
  },
  {
    id: 194,
    label: 'MENUITEMS.ADMIN.LIST.SERVICE',
    link: '/admin/services',
    icon: 'ri-settings-3-line',
    permission: 'services.view'
  },
  {
    id: 192,
    label: 'MENUITEMS.ADMIN.LIST.MEMBERSERVICE',
    link: '/admin/member-services',
    icon: 'ri-service-line',
    permission: 'memberservices.view'
  },
  {
    id: 193,
    label: 'MENUITEMS.ADMIN.LIST.OFFER',
    link: '/admin/offers',
    icon: 'ri-price-tag-3-line',
    permission: 'offers.view'
  },
  {
    id: 187,
    label: 'MENUITEMS.ADMIN.LIST.GALLERYIMAGE',
    link: '/admin/gallery-images',
    icon: 'ri-image-line',
    permission: 'galleryimages.view'
  }
];
