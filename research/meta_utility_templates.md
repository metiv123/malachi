# Utility templates



This document describes how to create and send utility templates.

Utility templates are typically sent in response to a user action or request, such as an order confirmation or update.

Utility templates have strict content requirements, particularly around marketing material. If you attempt to create or update a utility template with marketing material, the template will automatically be re-categorized as a marketing template.

See our [template categorization](https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/template-categorization#utility-template-guidelines) documentation for content guidelines.

## Supported components

Utility templates support the following components:

- 1 header (optional; all types supported)
- 1 body
- 1 footer (optional)
- Up to 10 buttons (optional). Supported types:
  - Call request
  - Copy code
  - Phone number
  - Quick-reply
  - URL

## Create a utility template

### Request syntax

Use the [Message Templates API](https://developers.facebook.com/documentation/business-messaging/whatsapp/reference/whatsapp-business-account/message-template-api#post-version-waba-id-message-templates) to create a utility template.

```html
curl &#039;https://graph.facebook.com/&lt;API_VERSION&gt;/&lt;WHATSAPP_BUSINESS_ACCOUNT_ID&gt;/message_templates&#039; \
-H &#039;Content-Type: application/json&#039; \
-H &#039;Authorization: Bearer &lt;ACCESS_TOKEN&gt;&#039; \
-d &#039;
&#123;
  &quot;name&quot;: &quot;&lt;TEMPLATE_NAME&gt;&quot;,
  &quot;language&quot;: &quot;&lt;TEMPLATE_LANGUAGE&gt;&quot;,
  &quot;category&quot;: &quot;utility&quot;,
  &quot;parameter_format&quot;: &quot;&lt;PARAMETER_FORMAT&gt;&quot;,
  &quot;components&quot;: [

    &lt;!-- header component optional --&gt;
    &#123;
      &quot;type&quot;: &quot;header&quot;,
      &quot;format&quot;: &quot;&lt;HEADER_TYPE&gt;&quot;,
      &quot;example&quot;: &#123;
        &quot;header_handle&quot;: [
          &quot;&lt;HEADER_HANDLE&gt;&quot;
        ]
      &#125;
    &#125;,

    &lt;!-- body component required --&gt;
    &#123;
      &quot;type&quot;: &quot;body&quot;,
      &quot;text&quot;: &quot;&lt;BODY_TEXT&gt;&quot;,

      &lt;!-- example required if &lt;BODY_TEXT&gt; contains one or more parameters --&gt;
      &quot;example&quot;: &#123;
        &quot;body_text_named_params&quot;: [
          &#123;
            &quot;param_name&quot;: &quot;&lt;PARAMETER_NAME&gt;&quot;,
            &quot;example&quot;: &quot;&lt;PARAMETER_EXAMPLE_VALUE&gt;&quot;
          &#125;,

          &lt;!-- additional parameters would follow, if using multiple parameters --&gt;
        ]
      &#125;
    &#125;,

    &lt;!-- footer component optional --&gt;
    &#123;
      &quot;type&quot;: &quot;footer&quot;,
      &quot;text&quot;: &quot;&lt;FOOTER_TEXT&gt;&quot;
    &#125;,

    &lt;!-- button components optional --&gt;
    &#123;
      &quot;type&quot;: &quot;buttons&quot;,
      &quot;buttons&quot;: [
        &#123;
          &quot;type&quot;: &quot;url&quot;,
          &quot;text&quot;: &quot;&lt;URL_BUTTON_LABEL_TEXT&gt;&quot;,
          &quot;url&quot;: &quot;&lt;URL&gt;&quot;
        &#125;,
        &#123;
          &quot;type&quot;: &quot;phone_number&quot;,
          &quot;text&quot;: &quot;&lt;PHONE_BUTTON_LABEL_TEXT&gt;&quot;,
          &quot;phone_number&quot;: &quot;&lt;PHONE_NUMBER&gt;&quot;
        &#125;,
        &#123;
          &quot;type&quot;: &quot;quick_reply&quot;,
          &quot;text&quot;: &quot;&lt;QUICK_REPLY_BUTTON_LABEL_TEXT&gt;&quot;
        &#125;
      ]
    &#125;
  ]
&#125;&#039;
```

### Request parameters

| Placeholder | Description | Example Value |
| --- | --- | --- |
| `&lt;ACCESS_TOKEN&gt;`&lt;br&gt;&lt;br&gt;_String_ | **Required.**&lt;br&gt;&lt;br&gt;[System token](https://developers.facebook.com/documentation/business-messaging/whatsapp/access-tokens#system-user-access-tokens) or [business token](https://developers.facebook.com/documentation/business-messaging/whatsapp/access-tokens#business-integration-system-user-access-tokens). | `EAAA...` |
| `&lt;API_VERSION&gt;`&lt;br&gt;&lt;br&gt;_String_ | **Optional.**&lt;br&gt;&lt;br&gt;Graph API version. | v25.0 |
| `&lt;BODY_TEXT&gt;`&lt;br&gt;&lt;br&gt;_String_ | **Required.**&lt;br&gt;&lt;br&gt;Template body text. Variables are supported.&lt;br&gt;&lt;br&gt;Maximum 1024 characters. | `You&#039;re all set! Your reservation for &#123;&#123;number_of_guests&#125;&#125; at Lucky Shrub Eatery on &#123;&#123;day&#125;&#125;, &#123;&#123;date&#125;&#125;, at &#123;&#123;time&#125;&#125;, is confirmed. See you then!` |
| `&lt;FOOTER_TEXT&gt;`&lt;br&gt;&lt;br&gt;_String_ | **Optional.**&lt;br&gt;&lt;br&gt;Template footer text. Variables are supported.&lt;br&gt;&lt;br&gt;Maximum 60 characters. | `Lucky Shrub Eatery: The Luckiest Eatery in Town!` |
| `&lt;HEADER_ASSET_HANDLE&gt;`&lt;br&gt;&lt;br&gt;_String_ | **Required if using a header with a media asset.**&lt;br&gt;&lt;br&gt;Asset handle of example media asset uploaded on your WhatsApp Business account.&lt;br&gt;&lt;br&gt;Maximum 60 characters. | `4::aW1hZ2UvcG5n:ARYpf5zqqUjggwGfsZOJ2_o26Zs8ntcO2mss2vKpFb8P_IvskL043YXKpehYTD7IxqEB4t-uZcIzOTxOFRavEcN_tZLhk1WXFb3IOr4S8UKJcQ:e:1759093121:634974688087057:100089620928913:ARYyOAh63uQLhDpqOdk\n4::aW1hZ2UvcG5n:ARZW8t9-cBNjpdmxV5Z9wcRAMhfmw4ATpJcJiHT0nY62hXq4ppOeBaTWaGI0IwX-twF2IkeKo-_MyW2pEDuBAE5vyw2oHTNgPZQkntclrgWMGg:e:1759093121:634974688087057:100089620928913:ARZE4NC5MrxnZUe5GRw` |
| `&lt;HEADER_TYPE&gt;`&lt;br&gt;&lt;br&gt;_String_ | **Required if using a header.**&lt;br&gt;&lt;br&gt;Header format. Values can be:&lt;br&gt;&lt;br&gt;- documentation&lt;br&gt;- image&lt;br&gt;- location&lt;br&gt;- text&lt;br&gt;- video | `image` |
| `&lt;PARAMETER_EXAMPLE_VALUE&gt;`&lt;br&gt;&lt;br&gt;_String_ | **Required if using a body component string that includes one or more parameters.**&lt;br&gt;&lt;br&gt;Example parameter value. You must supply an example for each parameter defined in your body component string. | `Saturday` |
| `&lt;PARAMETER_NAME&gt;`&lt;br&gt;&lt;br&gt;_String_ | **Required if using named parameters.**&lt;br&gt;&lt;br&gt;Must be a unique string, composed of lowercase characters and underscores, wrapped in double curly brackets. | `&#123;&#123;day&#125;&#125;` |
| `&lt;PHONE_BUTTON_LABEL_TEXT&gt;`&lt;br&gt;&lt;br&gt;_String_ | **Required if using a phone number button.**&lt;br&gt;&lt;br&gt;Button label text.&lt;br&gt;&lt;br&gt;Maximum 25 characters. Alphanumeric characters only. | `Change reservation` |
| `&lt;PHONE_NUMBER&gt;`&lt;br&gt;&lt;br&gt;_String_ | **Required if using a phone number button component.**&lt;br&gt;&lt;br&gt;Business phone number to be called in the WhatsApp user&#039;s default phone app when tapped by the user.&lt;br&gt;&lt;br&gt;Note that some countries have special phone numbers that have leading zeros after the country calling code (for example, +55-0-955-585-95436). If you assign one of these numbers to the button, the leading zero will be stripped from the number. If your number will not work without the leading zero, assign an alternate number to the button, or add the number as message&lt;br&gt;&lt;br&gt;Maximum 20 characters. Alphanumeric characters only. | `15550051310` |
| `&lt;QUICK_REPLY_BUTTON_LABEL_TEXT&gt;` | **Required if using a quick-reply button.**&lt;br&gt;&lt;br&gt;Button label text.&lt;br&gt;&lt;br&gt;Maximum 25 characters. Alphanumeric characters only. | `Cancel reservation` |
| `&lt;TEMPLATE_LANGUAGE&gt;`&lt;br&gt;&lt;br&gt;_String_ | **Required.**&lt;br&gt;&lt;br&gt;[Template language code](https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/supported-languages). | `en_US` |
| `&lt;TEMPLATE_NAME&gt;`&lt;br&gt;&lt;br&gt;_String_ | **Required.**&lt;br&gt;&lt;br&gt;Template name. Must be unique, unless existing templates with the same name have a different template language.&lt;br&gt;&lt;br&gt;Maximum 512 characters. Lowercase, alphanumeric characters and underscores only. | `reservation_confirmation` |
| `&lt;URL&gt;`&lt;br&gt;&lt;br&gt;_String_ | **Required if including a URL button.**&lt;br&gt;&lt;br&gt;URL to be loaded in WhatsApp user&#039;s default web browser when tapped. | `https://www.luckyshrubeater.com/reservations` |
| `&lt;URL_BUTTON_LABEL_TEXT&gt;`&lt;br&gt;&lt;br&gt;_String_ | **Required if using a URL button.**&lt;br&gt;&lt;br&gt;Button label text.&lt;br&gt;&lt;br&gt;Maximum 25 characters. Alphanumeric characters only. | `Change reservation` |
| `&lt;WHATSAPP_BUSINESS_ACCOUNT_ID&gt;` | **Required.**&lt;br&gt;&lt;br&gt;WhatsApp Business account ID. | `546151681022936` |

### Response syntax

Upon success:

```html
&#123;
  &quot;id&quot;: &quot;&lt;TEMPLATE_ID&gt;&quot;,
  &quot;status&quot;: &quot;&lt;TEMPLATE_STATUS&gt;&quot;,
  &quot;category&quot;: &quot;&lt;TEMPLATE_CATEGORY&gt;&quot;
&#125;
```

### Response parameters

| Placeholder | Description | Example value |
| --- | --- | --- |
| `&lt;TEMPLATE_CATEGORY&gt;` | [Template category](https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/template-categorization). | `UTILITY` |
| `&lt;TEMPLATE_ID&gt;` | Template ID. | `546151681022936` |
| `&lt;TEMPLATE_STATUS&gt;` | [Template status](https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/overview#template-status). | `PENDING` |

### Example request

This example request creates a utility template with:

- an image header component
- a body component with a string that has 4 named parameters
- a footer component
- a URL button component
- a phone number button component
- a quick-reply button component

```bash
curl &#039;https://graph.facebook.com/v23.0/102290129340398/message_templates&#039; \
-H &#039;Content-Type: application/json&#039; \
-H &#039;Authorization: Bearer EAAJB...&#039; \
-d &#039;
&#123;
  &quot;name&quot;: &quot;reservation_confirmation&quot;,
  &quot;language&quot;: &quot;en_US&quot;,
  &quot;category&quot;: &quot;utility&quot;,
  &quot;parameter_format&quot;: &quot;named&quot;,
  &quot;components&quot;: [
    &#123;
      &quot;type&quot;: &quot;header&quot;,
      &quot;format&quot;: &quot;image&quot;,
      &quot;example&quot;: &#123;
        &quot;header_handle&quot;: [
          &quot;4::aW...&quot;
        ]
      &#125;
    &#125;,
    &#123;
      &quot;type&quot;: &quot;body&quot;,
      &quot;text&quot;: &quot;*You&#039;re all set!*\n\nYour reservation for &#123;&#123;number_of_guests&#125;&#125; at Lucky Shrub Eatery on &#123;&#123;day&#125;&#125;, &#123;&#123;date&#125;&#125;, at &#123;&#123;time&#125;&#125;, is confirmed. See you then!&quot;,
      &quot;example&quot;: &#123;
        &quot;body_text_named_params&quot;: [
          &#123;
            &quot;param_name&quot;: &quot;number_of_guests&quot;,
            &quot;example&quot;: &quot;4&quot;
          &#125;,
          &#123;
            &quot;param_name&quot;: &quot;day&quot;,
            &quot;example&quot;: &quot;Saturday&quot;
          &#125;,
          &#123;
            &quot;param_name&quot;: &quot;date&quot;,
            &quot;example&quot;: &quot;August 30th, 2025&quot;
          &#125;,
          &#123;
            &quot;param_name&quot;: &quot;time&quot;,
            &quot;example&quot;: &quot;7:30 pm&quot;
          &#125;
        ]
      &#125;
    &#125;,
    &#123;
      &quot;type&quot;: &quot;footer&quot;,
      &quot;text&quot;: &quot;Lucky Shrub Eatery: The Luckiest Eatery in Town!&quot;
    &#125;,
    &#123;
      &quot;type&quot;: &quot;buttons&quot;,
      &quot;buttons&quot;: [
        &#123;
          &quot;type&quot;: &quot;url&quot;,
          &quot;text&quot;: &quot;Change reservation&quot;,
          &quot;url&quot;: &quot;https://www.luckyshrubeater.com/reservations&quot;
        &#125;,
        &#123;
          &quot;type&quot;: &quot;phone_number&quot;,
          &quot;text&quot;: &quot;Call us&quot;,
          &quot;phone_number&quot;: &quot;+15550051310&quot;
        &#125;,
        &#123;
          &quot;type&quot;: &quot;quick_reply&quot;,
          &quot;text&quot;: &quot;Cancel reservation&quot;
        &#125;
      ]
    &#125;
  ]
&#125;&#039;
```

### Example response

```json
&#123;
  &quot;id&quot;: &quot;546151681022936&quot;,
  &quot;status&quot;: &quot;PENDING&quot;,
  &quot;category&quot;: &quot;UTILITY&quot;
&#125;
```

## Send a utility template

### Request syntax

Use the [Messages API](https://developers.facebook.com/documentation/business-messaging/whatsapp/reference/whatsapp-business-phone-number/message-api#post-version-phone-number-id-messages) to send an approved utility template in template message.

```bash
curl &#039;https://graph.facebook.com/&lt;API_VERSION&gt;/&lt;WHATSAPP_BUSINESS_PHONE_NUMBER_ID&gt;/messages&#039; \
-H &#039;Content-Type: application/json&#039; \
-H &#039;Authorization: Bearer &lt;ACCESS_TOKEN&gt;&#039; \
-d &#039;
&#123;
  &quot;messaging_product&quot;: &quot;whatsapp&quot;,
  &quot;recipient_type&quot;: &quot;individual&quot;,
  &quot;to&quot;: &quot;&lt;WHATSAPP_USER_PHONE_NUMBER&gt;&quot;,
  &quot;type&quot;: &quot;template&quot;,
  &quot;template&quot;: &#123;
    &quot;name&quot;: &quot;&lt;TEMPLATE_NAME&gt;&quot;,
    &quot;language&quot;: &#123;
      &quot;code&quot;: &quot;&lt;TEMPLATE_LANGUAGE&gt;&quot;
    &#125;,
    &quot;components&quot;: [

      &lt;!-- Only required if the template uses a media header component --&gt;
      &#123;
        &quot;type&quot;: &quot;header&quot;,
        &quot;parameters&quot;: [
          &#123;
            &quot;type&quot;: &quot;&lt;MEDIA_HEADER_TYPE&gt;&quot;,
            &quot;&lt;MEDIA_HEADER_TYPE&gt;&quot;: &#123;
              &quot;id&quot;: &quot;&lt;MEDIA_HEADER_ASSET_ID&gt;&quot;
            &#125;
          &#125;
        ]
      &#125;,

      &lt;!-- Only required if the template uses body component parameters --&gt;
      &#123;
        &quot;type&quot;: &quot;body&quot;,
        &quot;parameters&quot;: [
          &#123;
            &quot;type&quot;: &quot;&lt;NAMED_PARAM_TYPE&gt;&quot;,
            &quot;parameter_name&quot;: &quot;&lt;NAMED_PARAM_NAME&gt;&quot;,
            &quot;text&quot;: &quot;&lt;NAMED_PARAM_VALUE&gt;&quot;
          &#125;,

          &lt;!-- Additional parameters values would follow, if needed --&gt;

        ]
      &#125;
    ]
  &#125;
&#125;&#039;
```

### Request parameters

| Placeholder | Description | Example Value |
| --- | --- | --- |
| `&lt;ACCESS_TOKEN&gt;`&lt;br&gt;&lt;br&gt;_String_ | **Required.**&lt;br&gt;&lt;br&gt;[System token](https://developers.facebook.com/documentation/business-messaging/whatsapp/access-tokens#system-user-access-tokens) or [business token](https://developers.facebook.com/documentation/business-messaging/whatsapp/access-tokens#business-integration-system-user-access-tokens). | `EAAA...` |
| `&lt;API_VERSION&gt;`&lt;br&gt;&lt;br&gt;_String_ | **Optional.**&lt;br&gt;&lt;br&gt;API version. If omitted, defaults to the newest API version available to your app. | v25.0 |
| `&lt;MEDIA_HEADER_ASSET_ID&gt;`&lt;br&gt;&lt;br&gt;_String_ | **Required if template uses a media header component.** | `2871834006348767` |
| `&lt;MEDIA_HEADER_TYPE&gt;`&lt;br&gt;&lt;br&gt;_String_ | **Required if template uses a media header component.**&lt;br&gt;&lt;br&gt;Media header type. Values can be:&lt;br&gt;&lt;br&gt;- document&lt;br&gt;- image&lt;br&gt;- video&lt;br&gt;&lt;br&gt;Note that this placeholder appears twice in the request syntax above. | `image` |
| `&lt;NAMED_PARAM_NAME&gt;` | **Required if template uses body component parameters.**&lt;br&gt;&lt;br&gt;Name of parameter as defined in the template body component text string. | `number_of_guests` |
| `&lt;NAMED_PARAM_TYPE&gt;` | **Required if template uses body component parameters.**&lt;br&gt;&lt;br&gt;Parameter type. Set to text. | `text` |
| `&lt;NAMED_PARAM_VALUE&gt;` | **Required if template uses body component parameters.**&lt;br&gt;&lt;br&gt;Parameter value. | `4` |
| `&lt;TEMPLATE_LANGUAGE&gt;`&lt;br&gt;&lt;br&gt;_String_ | **Required.**&lt;br&gt;&lt;br&gt;[Template language code](https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/supported-languages). | `en_US` |
| `&lt;TEMPLATE_NAME&gt;`&lt;br&gt;&lt;br&gt;_String_ | **Required.**&lt;br&gt;&lt;br&gt;Template name. Must be unique, unless existing templates with the same name have a different template language.&lt;br&gt;&lt;br&gt;Maximum 512 characters. Lowercase, alphanumeric characters and underscores only. | `reservation_confirmation` |
| `&lt;WHATSAPP_BUSINESS_ACCOUNT_ID&gt;` | **Required.**&lt;br&gt;&lt;br&gt;WhatsApp Business account ID. | `546151681022936` |
| `&lt;WHATSAPP_USER_PHONE_NUMBER&gt;` | **Required.**&lt;br&gt;&lt;br&gt;WhatsApp user phone number. | `16505551234` |

### Response syntax

Upon success:

```json
&#123;
  &quot;messaging_product&quot;: &quot;whatsapp&quot;,
  &quot;contacts&quot;: [
    &#123;
      &quot;input&quot;: &quot;&lt;WHATSAPP_USER_PHONE_NUMBER&gt;&quot;,
      &quot;wa_id&quot;: &quot;&lt;WHATSAPP_USER_ID&gt;&quot;
    &#125;
  ],
  &quot;messages&quot;: [
    &#123;
      &quot;id&quot;: &quot;&lt;WHATSAPP_MESSAGE_ID&gt;&quot;,
      &quot;message_status&quot;: &quot;&lt;PACING_STATUS&gt;&quot;
    &#125;
  ]
&#125;
```

### Response parameters

| Placeholder | Description | Example Value |
| --- | --- | --- |
| `&lt;PACING_STATUS&gt;` | [Template pacing](https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/template-pacing) status. | `accepted` |
| `&lt;WHATSAPP_MESSAGE_ID&gt;` | WhatsApp Message ID.&lt;br&gt;&lt;br&gt;This ID is included in status [messages](https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/reference/messages/status) webhooks for delivery status purposes. | `wamid.HBgLMTY1MDM4Nzk0MzkVAgARGBJBRkJENzExMTRFRjk2NTI1OTEA` |
| `&lt;WHATSAPP_USER_ID&gt;` | WhatsApp user&#039;s WhatsApp ID. May not match input value. | `16505551234` |
| `&lt;WHATSAPP_USER_PHONE_NUMBER&gt;` | WhatsApp user&#039;s WhatsApp phone number. May not match wa_id value. | `16505551234` |

### Example request

This is an example request that sends the template created in the example template creation request above.

```bash
curl &#039;https://graph.facebook.com/v23.0/106540352242922/messages&#039; \
-H &#039;Content-Type: application/json&#039; \
-H &#039;Authorization: Bearer EAAJB...&#039; \
-d &#039;
&#123;
  &quot;messaging_product&quot;: &quot;whatsapp&quot;,
  &quot;recipient_type&quot;: &quot;individual&quot;,
  &quot;to&quot;: &quot;16505551234&quot;,
  &quot;type&quot;: &quot;template&quot;,
  &quot;template&quot;: &#123;
    &quot;name&quot;: &quot;reservation_confirmation&quot;,
    &quot;language&quot;: &#123;
      &quot;code&quot;: &quot;en_US&quot;
    &#125;,
    &quot;components&quot;: [
      &#123;
        &quot;type&quot;: &quot;header&quot;,
        &quot;parameters&quot;: [
          &#123;
            &quot;type&quot;: &quot;image&quot;,
            &quot;image&quot;: &#123;
              &quot;id&quot;: &quot;2871834006348767&quot;
            &#125;
          &#125;
        ]
      &#125;,
      &#123;
        &quot;type&quot;: &quot;body&quot;,
        &quot;parameters&quot;: [
          &#123;
            &quot;type&quot;: &quot;text&quot;,
            &quot;parameter_name&quot;: &quot;number_of_guests&quot;,
            &quot;text&quot;: &quot;4&quot;
          &#125;,
          &#123;
            &quot;type&quot;: &quot;text&quot;,
            &quot;parameter_name&quot;: &quot;day&quot;,
            &quot;text&quot;: &quot;Saturday&quot;
          &#125;,
          &#123;
            &quot;type&quot;: &quot;text&quot;,
            &quot;parameter_name&quot;: &quot;date&quot;,
            &quot;text&quot;: &quot;August 30th, 2025&quot;
          &#125;,
          &#123;
            &quot;type&quot;: &quot;text&quot;,
            &quot;parameter_name&quot;: &quot;time&quot;,
            &quot;text&quot;: &quot;7:30 pm&quot;
          &#125;
        ]
      &#125;
    ]
  &#125;
&#125;&#039;
```

### Example response

```json
&#123;
  &quot;messaging_product&quot;: &quot;whatsapp&quot;,
  &quot;contacts&quot;: [
    &#123;
      &quot;input&quot;: &quot;16505551234&quot;,
      &quot;wa_id&quot;: &quot;16505551234&quot;
    &#125;
  ],
  &quot;messages&quot;: [
    &#123;
      &quot;id&quot;: &quot;wamid.HBgLMTY1MDM4Nzk0MzkVAgARGBJBRkJENzExMTRFRjk2NTI1OTEA&quot;,
      &quot;message_status&quot;: &quot;accepted&quot;
    &#125;
  ]
&#125;
```
