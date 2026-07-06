# Interactive reply buttons messages



Interactive reply buttons messages allow you to send up to three predefined replies for users to choose from.

Users can respond to a message by selecting one of the predefined buttons, which triggers a messages webhook describing their selection.

## Request syntax

Use the [Messages API](https://developers.facebook.com/documentation/business-messaging/whatsapp/reference/whatsapp-business-phone-number/message-api#post-version-phone-number-id-messages) to send an interactive reply buttons message to a WhatsApp user.

```html
curl &#039;https://graph.facebook.com/&lt;API_VERSION&gt;/&lt;WHATSAPP_BUSINESS_PHONE_NUMBER_ID&gt;/messages&#039; \
-H &#039;Content-Type: application/json&#039; \
-H &#039;Authorization: Bearer &lt;ACCESS_TOKEN&gt;&#039; \
-d &#039;
&#123;
  &quot;messaging_product&quot;: &quot;whatsapp&quot;,
  &quot;recipient_type&quot;: &quot;individual&quot;,
  &quot;to&quot;: &quot;&lt;WHATSAPP_USER_PHONE_NUMBER&gt;&quot;,
  &quot;type&quot;: &quot;interactive&quot;,
  &quot;interactive&quot;: &#123;
    &quot;type&quot;: &quot;button&quot;,
    &quot;header&quot;: &#123;&lt;MESSAGE_HEADER&gt;&#125;,
    &quot;body&quot;: &#123;
      &quot;text&quot;: &quot;&lt;BODY_TEXT&gt;&quot;
    &#125;,
    &quot;footer&quot;: &#123;
      &quot;text&quot;: &quot;&lt;FOOTER_TEXT&gt;&quot;
    &#125;,
    &quot;action&quot;: &#123;
      &quot;buttons&quot;: [
        &#123;
          &quot;type&quot;: &quot;reply&quot;,
          &quot;reply&quot;: &#123;
            &quot;id&quot;: &quot;&lt;BUTTON_ID&gt;&quot;,
            &quot;title&quot;: &quot;&lt;BUTTON_LABEL_TEXT&gt;&quot;
          &#125;
        &#125;
        &lt;!-- Additional buttons would go here (maximum 3) --&gt;
      ]
    &#125;
  &#125;
&#125;&#039;
```

## Request parameters

| Placeholder | Description | Sample value |
| --- | --- | --- |
| `&lt;ACCESS_TOKEN&gt;`&lt;br&gt;&lt;br&gt;_String_ | **Required.**&lt;br&gt;&lt;br&gt;[System token](https://developers.facebook.com/documentation/business-messaging/whatsapp/access-tokens#system-user-access-tokens) or [business token](https://developers.facebook.com/documentation/business-messaging/whatsapp/access-tokens#business-integration-system-user-access-tokens). | `EAAA...` |
| `&lt;API_VERSION&gt;`&lt;br&gt;&lt;br&gt;_String_ | **Optional.**&lt;br&gt;&lt;br&gt;Graph API version. | v25.0 |
| `&lt;BODY_TEXT&gt;`&lt;br&gt;&lt;br&gt;_String_ | **Required.**&lt;br&gt;&lt;br&gt;Body text. URLs are automatically hyperlinked.&lt;br&gt;&lt;br&gt;Maximum 1024 characters. | `Hi Pablo! Your gardening workshop is scheduled for 9am tomorrow. Use the buttons if you need to reschedule. Thank you!` |
| `&lt;BUTTON_ID&gt;`&lt;br&gt;&lt;br&gt;_String_ | **Required.**&lt;br&gt;&lt;br&gt;A unique identifier for each button. Supports up to 3 buttons.&lt;br&gt;&lt;br&gt;Maximum 256 characters. | `change-button` |
| `&lt;BUTTON_LABEL_TEXT&gt;`&lt;br&gt;&lt;br&gt;_String_ | **Required.**&lt;br&gt;&lt;br&gt;Button label text. Must be unique if using multiple buttons.&lt;br&gt;&lt;br&gt;Maximum 20 characters. | `Change` |
| `&lt;FOOTER_TEXT&gt;`&lt;br&gt;&lt;br&gt;_String_ | **Required if using a footer.**&lt;br&gt;&lt;br&gt;Footer text. URLs are automatically hyperlinked.&lt;br&gt;&lt;br&gt;Maximum 60 characters. | `Lucky Shrub: Your gateway to succulents!™` |
| `&lt;MESSAGE_HEADER&gt;`&lt;br&gt;&lt;br&gt;_JSON Object_ | **Optional.**&lt;br&gt;&lt;br&gt;Header content. Supports the following types:&lt;br&gt;&lt;br&gt;* `document`&lt;br&gt;* `image`&lt;br&gt;* `text`&lt;br&gt;* `video`&lt;br&gt;&lt;br&gt;Media assets can be sent using their [uploaded media](https://developers.facebook.com/documentation/business-messaging/whatsapp/business-phone-numbers/media#upload-media) `id` or URL `link` (not recommended). | Image header example using uploaded media ID (same basic structure for all media types):&lt;br&gt;`&#123; &quot;type&quot;: &quot;image&quot;, &quot;image&quot;: &#123; &quot;id&quot;: &quot;2762702990552401&quot; &#125;`&lt;br&gt;&lt;br&gt;&lt;br&gt;Image header example using hosted media:&lt;br&gt;`&#123; &quot;type&quot;: &quot;image&quot;, &quot;image&quot;: &#123; &quot;link&quot;: &quot;https://www.luckyshrub.com/media/workshop-banner.png&quot; &#125;`&lt;br&gt;&lt;br&gt;&lt;br&gt;Text header example:&lt;br&gt;`&#123; &quot;type&quot;:&quot;text&quot;, &quot;text&quot;: &quot;Workshop Details&quot; &#125;`&lt;br&gt; |
| `&lt;WHATSAPP_BUSINESS_PHONE_NUMBER_ID&gt;`&lt;br&gt;&lt;br&gt;_String_ | **Required.**&lt;br&gt;&lt;br&gt;WhatsApp business phone number ID. | `106540352242922` |
| `&lt;WHATSAPP_USER_PHONE_NUMBER&gt;`&lt;br&gt;&lt;br&gt;_String_ | **Required.**&lt;br&gt;&lt;br&gt;WhatsApp user phone number. | `+16505551234` |

## Example request

Example request to send an interactive reply buttons message with an image header, body text, footer text, and two reply buttons.

```curl
curl &#039;https://graph.facebook.com/v25.0/106540352242922/messages&#039; \
-H &#039;Content-Type: application/json&#039; \
-H &#039;Authorization: Bearer EAAJB...&#039; \
-d &#039;
&#123;
  &quot;messaging_product&quot;: &quot;whatsapp&quot;,
  &quot;recipient_type&quot;: &quot;individual&quot;,
  &quot;to&quot;: &quot;+16505551234&quot;,
  &quot;type&quot;: &quot;interactive&quot;,
  &quot;interactive&quot;: &#123;
    &quot;type&quot;: &quot;button&quot;,
    &quot;header&quot;: &#123;
      &quot;type&quot;: &quot;image&quot;,
      &quot;image&quot;: &#123;
        &quot;id&quot;: &quot;2762702990552401&quot;
      &#125;
    &#125;,
    &quot;body&quot;: &#123;
      &quot;text&quot;: &quot;Hi Pablo! Your gardening workshop is scheduled for 9am tomorrow. Use the buttons if you need to reschedule. Thank you!&quot;
    &#125;,
    &quot;footer&quot;: &#123;
      &quot;text&quot;: &quot;Lucky Shrub: Your gateway to succulents!™&quot;
    &#125;,
    &quot;action&quot;: &#123;
      &quot;buttons&quot;: [
        &#123;
          &quot;type&quot;: &quot;reply&quot;,
          &quot;reply&quot;: &#123;
            &quot;id&quot;: &quot;change-button&quot;,
            &quot;title&quot;: &quot;Change&quot;
          &#125;
        &#125;,
        &#123;
          &quot;type&quot;: &quot;reply&quot;,
          &quot;reply&quot;: &#123;
            &quot;id&quot;: &quot;cancel-button&quot;,
            &quot;title&quot;: &quot;Cancel&quot;
          &#125;
        &#125;
      ]
    &#125;
  &#125;
&#125;&#039;
```

## Example response

```json
&#123;
  &quot;messaging_product&quot;: &quot;whatsapp&quot;,
  &quot;contacts&quot;: [
    &#123;
      &quot;input&quot;: &quot;+16505551234&quot;,
      &quot;wa_id&quot;: &quot;16505551234&quot;
    &#125;
  ],
  &quot;messages&quot;: [
    &#123;
      &quot;id&quot;: &quot;wamid.HBgLMTY0NjcwNDM1OTUVAgARGBI1RjQyNUE3NEYxMzAzMzQ5MkEA&quot;
    &#125;
  ]
&#125;
```


## Webhooks

When a WhatsApp user taps on a reply button, a **messages** webhook is triggered that describes their selection in a `button_reply` object:

```json
&quot;button_reply&quot;: &#123;
  &quot;id&quot;: &quot;&lt;BUTTON_ID&gt;&quot;,
  &quot;title&quot;: &quot;&lt;BUTTON_LABEL_TEXT&gt;&quot;
&#125;
```

* `&lt;BUTTON_ID&gt;` — The button ID of the button tapped by the user.
* `&lt;BUTTON_LABEL_TEXT&gt;` — The button label text of the button tapped by the user.

### Example webhook

```json
&#123;
  &quot;object&quot;: &quot;whatsapp_business_account&quot;,
  &quot;entry&quot;: [
    &#123;
      &quot;id&quot;: &quot;102290129340398&quot;,
      &quot;changes&quot;: [
        &#123;
          &quot;value&quot;: &#123;
            &quot;messaging_product&quot;: &quot;whatsapp&quot;,
            &quot;metadata&quot;: &#123;
              &quot;display_phone_number&quot;: &quot;15550783881&quot;,
              &quot;phone_number_id&quot;: &quot;106540352242922&quot;
            &#125;,
            &quot;contacts&quot;: [
              &#123;
                &quot;profile&quot;: &#123;
                  &quot;name&quot;: &quot;Pablo Morales&quot;
                &#125;,
                &quot;wa_id&quot;: &quot;16505551234&quot;
              &#125;
            ],
            &quot;messages&quot;: [
              &#123;
                &quot;context&quot;: &#123;
                  &quot;from&quot;: &quot;15550783881&quot;,
                  &quot;id&quot;: &quot;wamid.HBgLMTY0NjcwNDM1OTUVAgARGBJBM0Y4RUU0RUNFQkFDMjYzQUMA&quot;
                &#125;,
                &quot;from&quot;: &quot;16505551234&quot;,
                &quot;id&quot;: &quot;wamid.HBgLMTY0NjcwNDM1OTUVAgASGBQzQThBREYwNzc2RDc2QjA1QTIwMgA=&quot;,
                &quot;timestamp&quot;: &quot;1714510003&quot;,
                &quot;type&quot;: &quot;interactive&quot;,
                &quot;interactive&quot;: &#123;
                  &quot;type&quot;: &quot;button_reply&quot;,
                  &quot;button_reply&quot;: &#123;
                    &quot;id&quot;: &quot;change-button&quot;,
                    &quot;title&quot;: &quot;Change&quot;
                  &#125;
                &#125;
              &#125;
            ]
          &#125;,
          &quot;field&quot;: &quot;messages&quot;
        &#125;
      ]
    &#125;
  ]
&#125;
```
