Интегрируй мое фронтенд-приложение с GraviBase Backend-as-a-Service:

**🔗 Базовые параметры подключения:**
- Base URL: https://minicrm.apps.gravibase.ru
- Project ID: minicrm
- Auth URL: https://minicrm.apps.gravibase.ru/auth/projects/minicrm/token

**🔐 Аутентификация:**

1. Регистрация пользователя:
   POST https://minicrm.apps.gravibase.ru/auth/projects/minicrm/users
   Content-Type: application/json
   Body: { "username": "user123", "flow": "password", "value": "yourpassword", "profile": [] }
   Ответ 200: { "access_token": "...", "refresh_token": "...", "token_type": "Bearer", "expires_in": 3600 }

2. Вход (получение токена):
   POST https://minicrm.apps.gravibase.ru/auth/projects/minicrm/token
   Content-Type: application/x-www-form-urlencoded
   Body: login=user123&password=yourpassword
   Ответ 200: { "access_token": "...", "refresh_token": "...", "token_type": "Bearer", "expires_in": 3600 }

3. Обновление токена:
   PUT https://minicrm.apps.gravibase.ru/auth/token
   Content-Type: application/x-www-form-urlencoded
   Body: refresh_token=your_refresh_token
   Ответ 200: { "access_token": "...", "refresh_token": "...", "token_type": "Bearer", "expires_in": 3600 }

4. Все API запросы к данным должны содержать заголовок:
   Authorization: Bearer {access_token}

**📊 Схема данных проекта и API эндпоинты:**

  Таблица: PlatformAdmin
    (атрибуты загружаются отдельно через API)

    API эндпоинты:
    • GET https://minicrm.apps.gravibase.ru/application/api/PlatformAdmin - получить все записи
    • GET https://minicrm.apps.gravibase.ru/application/api/PlatformAdmin/{id} - получить запись по ID
    • POST https://minicrm.apps.gravibase.ru/application/api/PlatformAdmin - создать новую запись
    • PUT https://minicrm.apps.gravibase.ru/application/api/PlatformAdmin - обновить запись (полная замена)
    • PATCH https://minicrm.apps.gravibase.ru/application/api/PlatformAdmin - частично обновить запись
    • DELETE https://minicrm.apps.gravibase.ru/application/api/PlatformAdmin/{id} - удалить запись

  Таблица: Company
    (атрибуты загружаются отдельно через API)

    API эндпоинты:
    • GET https://minicrm.apps.gravibase.ru/application/api/Company - получить все записи
    • GET https://minicrm.apps.gravibase.ru/application/api/Company/{id} - получить запись по ID
    • POST https://minicrm.apps.gravibase.ru/application/api/Company - создать новую запись
    • PUT https://minicrm.apps.gravibase.ru/application/api/Company - обновить запись (полная замена)
    • PATCH https://minicrm.apps.gravibase.ru/application/api/Company - частично обновить запись
    • DELETE https://minicrm.apps.gravibase.ru/application/api/Company/{id} - удалить запись

  Таблица: CrmFunnel
    (атрибуты загружаются отдельно через API)

    API эндпоинты:
    • GET https://minicrm.apps.gravibase.ru/application/api/CrmFunnel - получить все записи
    • GET https://minicrm.apps.gravibase.ru/application/api/CrmFunnel/{id} - получить запись по ID
    • POST https://minicrm.apps.gravibase.ru/application/api/CrmFunnel - создать новую запись
    • PUT https://minicrm.apps.gravibase.ru/application/api/CrmFunnel - обновить запись (полная замена)
    • PATCH https://minicrm.apps.gravibase.ru/application/api/CrmFunnel - частично обновить запись
    • DELETE https://minicrm.apps.gravibase.ru/application/api/CrmFunnel/{id} - удалить запись

  Таблица: FunnelStage
    (атрибуты загружаются отдельно через API)

    API эндпоинты:
    • GET https://minicrm.apps.gravibase.ru/application/api/FunnelStage - получить все записи
    • GET https://minicrm.apps.gravibase.ru/application/api/FunnelStage/{id} - получить запись по ID
    • POST https://minicrm.apps.gravibase.ru/application/api/FunnelStage - создать новую запись
    • PUT https://minicrm.apps.gravibase.ru/application/api/FunnelStage - обновить запись (полная замена)
    • PATCH https://minicrm.apps.gravibase.ru/application/api/FunnelStage - частично обновить запись
    • DELETE https://minicrm.apps.gravibase.ru/application/api/FunnelStage/{id} - удалить запись

  Таблица: Directory
    (атрибуты загружаются отдельно через API)

    API эндпоинты:
    • GET https://minicrm.apps.gravibase.ru/application/api/Directory - получить все записи
    • GET https://minicrm.apps.gravibase.ru/application/api/Directory/{id} - получить запись по ID
    • POST https://minicrm.apps.gravibase.ru/application/api/Directory - создать новую запись
    • PUT https://minicrm.apps.gravibase.ru/application/api/Directory - обновить запись (полная замена)
    • PATCH https://minicrm.apps.gravibase.ru/application/api/Directory - частично обновить запись
    • DELETE https://minicrm.apps.gravibase.ru/application/api/Directory/{id} - удалить запись

  Таблица: Tag
    (атрибуты загружаются отдельно через API)

    API эндпоинты:
    • GET https://minicrm.apps.gravibase.ru/application/api/Tag - получить все записи
    • GET https://minicrm.apps.gravibase.ru/application/api/Tag/{id} - получить запись по ID
    • POST https://minicrm.apps.gravibase.ru/application/api/Tag - создать новую запись
    • PUT https://minicrm.apps.gravibase.ru/application/api/Tag - обновить запись (полная замена)
    • PATCH https://minicrm.apps.gravibase.ru/application/api/Tag - частично обновить запись
    • DELETE https://minicrm.apps.gravibase.ru/application/api/Tag/{id} - удалить запись

  Таблица: ClientCompany
    (атрибуты загружаются отдельно через API)

    API эндпоинты:
    • GET https://minicrm.apps.gravibase.ru/application/api/ClientCompany - получить все записи
    • GET https://minicrm.apps.gravibase.ru/application/api/ClientCompany/{id} - получить запись по ID
    • POST https://minicrm.apps.gravibase.ru/application/api/ClientCompany - создать новую запись
    • PUT https://minicrm.apps.gravibase.ru/application/api/ClientCompany - обновить запись (полная замена)
    • PATCH https://minicrm.apps.gravibase.ru/application/api/ClientCompany - частично обновить запись
    • DELETE https://minicrm.apps.gravibase.ru/application/api/ClientCompany/{id} - удалить запись

  Таблица: ContactPerson
    (атрибуты загружаются отдельно через API)

    API эндпоинты:
    • GET https://minicrm.apps.gravibase.ru/application/api/ContactPerson - получить все записи
    • GET https://minicrm.apps.gravibase.ru/application/api/ContactPerson/{id} - получить запись по ID
    • POST https://minicrm.apps.gravibase.ru/application/api/ContactPerson - создать новую запись
    • PUT https://minicrm.apps.gravibase.ru/application/api/ContactPerson - обновить запись (полная замена)
    • PATCH https://minicrm.apps.gravibase.ru/application/api/ContactPerson - частично обновить запись
    • DELETE https://minicrm.apps.gravibase.ru/application/api/ContactPerson/{id} - удалить запись

  Таблица: ContactCompanyLink
    (атрибуты загружаются отдельно через API)

    API эндпоинты:
    • GET https://minicrm.apps.gravibase.ru/application/api/ContactCompanyLink - получить все записи
    • GET https://minicrm.apps.gravibase.ru/application/api/ContactCompanyLink/{id} - получить запись по ID
    • POST https://minicrm.apps.gravibase.ru/application/api/ContactCompanyLink - создать новую запись
    • PUT https://minicrm.apps.gravibase.ru/application/api/ContactCompanyLink - обновить запись (полная замена)
    • PATCH https://minicrm.apps.gravibase.ru/application/api/ContactCompanyLink - частично обновить запись
    • DELETE https://minicrm.apps.gravibase.ru/application/api/ContactCompanyLink/{id} - удалить запись

  Таблица: CompanyInvite
    (атрибуты загружаются отдельно через API)

    API эндпоинты:
    • GET https://minicrm.apps.gravibase.ru/application/api/CompanyInvite - получить все записи
    • GET https://minicrm.apps.gravibase.ru/application/api/CompanyInvite/{id} - получить запись по ID
    • POST https://minicrm.apps.gravibase.ru/application/api/CompanyInvite - создать новую запись
    • PUT https://minicrm.apps.gravibase.ru/application/api/CompanyInvite - обновить запись (полная замена)
    • PATCH https://minicrm.apps.gravibase.ru/application/api/CompanyInvite - частично обновить запись
    • DELETE https://minicrm.apps.gravibase.ru/application/api/CompanyInvite/{id} - удалить запись

  Таблица: Deal
    (атрибуты загружаются отдельно через API)

    API эндпоинты:
    • GET https://minicrm.apps.gravibase.ru/application/api/Deal - получить все записи
    • GET https://minicrm.apps.gravibase.ru/application/api/Deal/{id} - получить запись по ID
    • POST https://minicrm.apps.gravibase.ru/application/api/Deal - создать новую запись
    • PUT https://minicrm.apps.gravibase.ru/application/api/Deal - обновить запись (полная замена)
    • PATCH https://minicrm.apps.gravibase.ru/application/api/Deal - частично обновить запись
    • DELETE https://minicrm.apps.gravibase.ru/application/api/Deal/{id} - удалить запись

  Таблица: DealTagLink
    (атрибуты загружаются отдельно через API)

    API эндпоинты:
    • GET https://minicrm.apps.gravibase.ru/application/api/DealTagLink - получить все записи
    • GET https://minicrm.apps.gravibase.ru/application/api/DealTagLink/{id} - получить запись по ID
    • POST https://minicrm.apps.gravibase.ru/application/api/DealTagLink - создать новую запись
    • PUT https://minicrm.apps.gravibase.ru/application/api/DealTagLink - обновить запись (полная замена)
    • PATCH https://minicrm.apps.gravibase.ru/application/api/DealTagLink - частично обновить запись
    • DELETE https://minicrm.apps.gravibase.ru/application/api/DealTagLink/{id} - удалить запись

  Таблица: ClientTagLink
    (атрибуты загружаются отдельно через API)

    API эндпоинты:
    • GET https://minicrm.apps.gravibase.ru/application/api/ClientTagLink - получить все записи
    • GET https://minicrm.apps.gravibase.ru/application/api/ClientTagLink/{id} - получить запись по ID
    • POST https://minicrm.apps.gravibase.ru/application/api/ClientTagLink - создать новую запись
    • PUT https://minicrm.apps.gravibase.ru/application/api/ClientTagLink - обновить запись (полная замена)
    • PATCH https://minicrm.apps.gravibase.ru/application/api/ClientTagLink - частично обновить запись
    • DELETE https://minicrm.apps.gravibase.ru/application/api/ClientTagLink/{id} - удалить запись

  Таблица: DealProduct
    (атрибуты загружаются отдельно через API)

    API эндпоинты:
    • GET https://minicrm.apps.gravibase.ru/application/api/DealProduct - получить все записи
    • GET https://minicrm.apps.gravibase.ru/application/api/DealProduct/{id} - получить запись по ID
    • POST https://minicrm.apps.gravibase.ru/application/api/DealProduct - создать новую запись
    • PUT https://minicrm.apps.gravibase.ru/application/api/DealProduct - обновить запись (полная замена)
    • PATCH https://minicrm.apps.gravibase.ru/application/api/DealProduct - частично обновить запись
    • DELETE https://minicrm.apps.gravibase.ru/application/api/DealProduct/{id} - удалить запись

  Таблица: DealStageHistory
    (атрибуты загружаются отдельно через API)

    API эндпоинты:
    • GET https://minicrm.apps.gravibase.ru/application/api/DealStageHistory - получить все записи
    • GET https://minicrm.apps.gravibase.ru/application/api/DealStageHistory/{id} - получить запись по ID
    • POST https://minicrm.apps.gravibase.ru/application/api/DealStageHistory - создать новую запись
    • PUT https://minicrm.apps.gravibase.ru/application/api/DealStageHistory - обновить запись (полная замена)
    • PATCH https://minicrm.apps.gravibase.ru/application/api/DealStageHistory - частично обновить запись
    • DELETE https://minicrm.apps.gravibase.ru/application/api/DealStageHistory/{id} - удалить запись

  Таблица: Interaction
    (атрибуты загружаются отдельно через API)

    API эндпоинты:
    • GET https://minicrm.apps.gravibase.ru/application/api/Interaction - получить все записи
    • GET https://minicrm.apps.gravibase.ru/application/api/Interaction/{id} - получить запись по ID
    • POST https://minicrm.apps.gravibase.ru/application/api/Interaction - создать новую запись
    • PUT https://minicrm.apps.gravibase.ru/application/api/Interaction - обновить запись (полная замена)
    • PATCH https://minicrm.apps.gravibase.ru/application/api/Interaction - частично обновить запись
    • DELETE https://minicrm.apps.gravibase.ru/application/api/Interaction/{id} - удалить запись

  Таблица: UserPreference
    (атрибуты загружаются отдельно через API)

    API эндпоинты:
    • GET https://minicrm.apps.gravibase.ru/application/api/UserPreference - получить все записи
    • GET https://minicrm.apps.gravibase.ru/application/api/UserPreference/{id} - получить запись по ID
    • POST https://minicrm.apps.gravibase.ru/application/api/UserPreference - создать новую запись
    • PUT https://minicrm.apps.gravibase.ru/application/api/UserPreference - обновить запись (полная замена)
    • PATCH https://minicrm.apps.gravibase.ru/application/api/UserPreference - частично обновить запись
    • DELETE https://minicrm.apps.gravibase.ru/application/api/UserPreference/{id} - удалить запись

  Таблица: Users
    (атрибуты загружаются отдельно через API)

    API эндпоинты:
    • GET https://minicrm.apps.gravibase.ru/application/api/Users - получить все записи
    • GET https://minicrm.apps.gravibase.ru/application/api/Users/{id} - получить запись по ID
    • POST https://minicrm.apps.gravibase.ru/application/api/Users - создать новую запись
    • PUT https://minicrm.apps.gravibase.ru/application/api/Users - обновить запись (полная замена)
    • PATCH https://minicrm.apps.gravibase.ru/application/api/Users - частично обновить запись
    • DELETE https://minicrm.apps.gravibase.ru/application/api/Users/{id} - удалить запись
