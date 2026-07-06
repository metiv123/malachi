# About the WhatsApp Business Platform



The WhatsApp Business Platform enables businesses to communicate with customers at scale.

This documentation is intended for developers using our APIs. If you are looking for information on other ways to use WhatsApp for your business see the [WhatsApp Business site](https://business.whatsapp.com/).

## Core APIs and capabilities

### WhatsApp Business Platform Cloud API

The WhatsApp Business Platform Cloud API enables you to programmatically message and call on WhatsApp. You can use Cloud API to send users a variety of messages, from simple text messages to rich media and interactive messages.

Cloud API includes:

* **Messaging:** Send text messages, rich media, and interactive messages
* **Calling:** Make and receive calls to customers
* **Groups:** Create, manage, and message WhatsApp group conversations

WhatsApp messaging lets you send encrypted messages to customers. Use Cloud API to:

* Send order confirmations and shipping updates
* Share appointment availability and other reminders
* Send messages that recommend related or additional products
* Facilitate end-to-end transactions, from product discovery to payment
* Enable multi-factor authentication or one-time passwords to verify accounts and users
* Deliver custom interactive conversational experiences

[Learn more about message types on Cloud API.](https://developers.facebook.com/documentation/business-messaging/whatsapp/messages/send-messages)

### WhatsApp Business Platform Business Management API

The WhatsApp Business Management API enables you to programmatically manage a WhatsApp Business account and its associated assets.

Manage account assets with Business Management API like:

* **Business phone numbers:** Add and remove phone numbers associated with your business.
* **Templates:** Create and modify message templates for scalable messaging.

Business Management API also gives you access to account analytics like:

* **Messaging analytics:** The number and type of messages sent and delivered.
* **Pricing analytics:** Granular pricing breakdowns for delivered messages.
* **Template analytics:** Sent/read/delivered template metrics, alongside template message button clicks.

- [Learn more about message templates.](https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/overview)
- [Learn more about managing business phone numbers.](https://developers.facebook.com/documentation/business-messaging/whatsapp/business-phone-numbers/phone-numbers)
- [Learn more about account analytics.](https://developers.facebook.com/documentation/business-messaging/whatsapp/analytics)

### Marketing Messages API for WhatsApp

MM API for WhatsApp is an API for sending optimized marketing messages on WhatsApp.

When you send marketing messages through the MM API for WhatsApp, you can access new features not available on Cloud API and get automatic optimizations, so high engagement messages can reach more customers.

The MM API for WhatsApp includes:

* **Quality-based delivery:** Up to 9% higher marketing message deliveries over Cloud API for high engagement content.
* **Automated creative optimizations:** Automatic enhancements to marketing creative to increase message performance.
* **Performance benchmarks and recommendations:** Comparison of read and click rates versus similar templates from businesses in your region.
* **Conversion metrics:** Measure marketing messages that lead users to perform app events such as &#039;Add to Cart&#039;, &#039;Checkout Initiated&#039;, or &#039;Purchase&#039;.

[Learn more about the Marketing Messages API for WhatsApp.](https://developers.facebook.com/documentation/business-messaging/whatsapp/marketing-messages/overview)

### Webhooks

Webhooks deliver JSON payloads to your server for message status updates, incoming messages, asynchronous error handling, and many other notification utilities.

The platform relies heavily on webhooks, as the contents of any message sent from a WhatsApp user to your business phone number is communicated via webhook, and all outgoing message delivery status updates are reported via webhook.

[Learn more about webhooks](https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/overview).

### Meta Business Agent

Meta Business Agent lets you configure and operate AI-powered agents on WhatsApp. Agents handle conversations with WhatsApp users autonomously, using knowledge sources you provide (FAQs, business info, product catalogs, files, and websites) and custom connectors to your external APIs.

Meta Business Agent includes:

* **Agent configuration:** Set agent behavior, persona, language, and system instructions
* **Knowledge management:** Connect FAQs, business info, catalogs, files, and websites for the agent to reference
* **Custom connectors:** Integrate your external APIs so the agent can take actions like checking order status or booking appointments
* **Thread control:** Manage handoffs between the AI agent and human agents
* **Evaluation and testing:** Test agent responses and evaluate performance

[Learn more about Meta Business Agent](https://developers.facebook.com/documentation/meta-business-agent/get-started).

## Technical foundations

### HTTP protocol and API requests

The WhatsApp Business Platform is built on [Graph API](https://developers.facebook.com/docs/graph-api/overview) and uses HTTP protocol. API requests include path, body, and header parameters.

#### Example: Sending a text message using cURL

```curl
curl &#039;https://graph.facebook.com/v17.0/106540352242922/messages&#039; \
  -H &#039;Content-Type: application/json&#039; \
  -H &#039;Authorization: Bearer EAAJB...&#039; \
  -d &#039;&#123;
    &quot;messaging_product&quot;: &quot;whatsapp&quot;,
    &quot;recipient_type&quot;: &quot;individual&quot;,
    &quot;to&quot;: &quot;+16505555555&quot;,
    &quot;type&quot;: &quot;text&quot;,
    &quot;text&quot;: &#123;
      &quot;preview_url&quot;: true,
      &quot;body&quot;: &quot;Here&#039;s the info you requested! https://www.meta.com/quest/quest-3/&quot;
    &#125;
  &#125;&#039;
```

[Learn more about the Graph API.](https://developers.facebook.com/docs/graph-api)

### JSON responses

API responses are formatted in JSON.

#### Example: Requesting a business phone number&#039;s metadata

```curl
&#123;
  &quot;verified_name&quot;: &quot;Lucky Shrub&quot;,
  &quot;code_verification_status&quot;: &quot;VERIFIED&quot;,
  &quot;display_phone_number&quot;: &quot;15550783881&quot;,
  &quot;quality_rating&quot;: &quot;GREEN&quot;,
  &quot;platform_type&quot;: &quot;CLOUD_API&quot;,
  &quot;throughput&quot;: &#123;
    &quot;level&quot;: &quot;STANDARD&quot;
  &#125;,
  &quot;webhook_configuration&quot;: &#123;
    &quot;application&quot;: &quot;https://www.luckyshrub.com/webhooks&quot;
  &#125;,
  &quot;id&quot;: &quot;106540352242922&quot;
&#125;
```

### Authentication and authorization

Authentication uses OAuth (not 2.0) access tokens, while permissions restrict access to specific resources.

- [Learn more about access tokens.](https://developers.facebook.com/documentation/business-messaging/whatsapp/access-tokens)
- [Learn more about permissions.](https://developers.facebook.com/documentation/business-messaging/whatsapp/permissions)

## Key resources

### Business portfolios

A business portfolio allows organizations to bring all their Meta business assets together so they can be managed in one place. On the WhatsApp Business Platform, a business portfolio mainly serves as a container for WhatsApp Business Accounts (WABA). You must have a business portfolio to use the platform.

Business portfolios can be verified, and verification status factors into improved functionality, such as higher throughput and [Official Business Account](https://developers.facebook.com/documentation/business-messaging/whatsapp/official-business-accounts) status.

[Learn more about business portfolios.](https://www.facebook.com/business/help/486932075688253)

### WhatsApp Business Accounts (WABA)

A WhatsApp Business account represents your business and contains phone numbers, usernames, and analytics.

[Learn more about WhatsApp Business Accounts.](https://developers.facebook.com/documentation/business-messaging/whatsapp/whatsapp-business-accounts)

### Business phone numbers

Business phone numbers, real, or virtual, are used for sending and receiving WhatsApp messages. They can have display names and earn Official Business Account status.

[Learn more about business phone numbers.](https://developers.facebook.com/documentation/business-messaging/whatsapp/business-phone-numbers/phone-numbers)

### Message templates

Templates are customizable messages that you can construct in advance of sending them. Template messages generally require approval before you can send them.

Templates are useful for messaging at scale. They are also the only type of message that can be sent to WhatsApp users outside of a [customer service window](https://developers.facebook.com/documentation/business-messaging/whatsapp/messages/send-messages#customer-service-windows).

Templates have quality scores and are subject to various messaging limits.

[Learn more about message templates.](https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/overview)

### Test resources

When you [get started with Cloud API](https://developers.facebook.com/documentation/business-messaging/whatsapp/get-started), a test WhatsApp Business account and test business phone number are automatically created for you. Test WhatsApp Business accounts and test phone numbers are useful for testing purposes, as they have relaxed messaging limits and don&#039;t require a payment method on file in order to send template messages.

You can delete your business portfolio and its test resources if:

* You are an admin on the business portfolio associated with the app
* No other apps are associated with the business portfolio
* The business portfolio is not associated with any other WhatsApp Business Accounts
* The WhatsApp Business account is not associated with any other business phone numbers.

To delete your business portfolio and its test resources:

1. Go to the **App Dashboard &gt; WhatsApp &gt; Configuration** panel.
2. Locate the **Test Account** section.
3. Click the **Delete** button.

Use the API Playground when testing endpoints. Find the playground in the &quot;API Reference&quot; section on the left sidebar of this page. In each reference, click the &quot;Try it&quot; button to open the playground.

Also helpful for testing is our [Postman collection](https://www.postman.com/meta/whatsapp-business-platform/).

## Tools and integrations

### WhatsApp Manager

WhatsApp Manager is a web app for managing WhatsApp Business Accounts, Messaging Accounts, phone numbers, templates, and reviewing analytics.

[Access WhatsApp Manager](https://business.facebook.com/wa/manage/home/)

### Third-party SDKs

Some SDKs, like [PyWa](https://pywa.readthedocs.io/en/2.0.1/) (Python wrapper), are available but are not maintained or endorsed by Meta.

### Postman collection

The official Postman collection lets you execute common API queries.

[Access the WhatsApp Business Platform Postman collection](https://www.postman.com/meta/whatsapp-business-platform/).

## Security and performance

### Throughput

Business phone numbers can send up to 80 messages per second by default, with capacity upgrades available.

[Learn more about throughput.](https://developers.facebook.com/documentation/business-messaging/whatsapp/throughput)

### Encryption

With Cloud API, every WhatsApp message continues to be protected by Signal protocol encryption that secures messages before they leave the device. Signal protocol encryption ensures that messages with a WhatsApp Business account are securely delivered to the destination chosen by each business.

Cloud API uses industry standard encryption techniques to protect data in transit and at rest. Cloud API uses Graph API for sending messages and Webhooks for receiving events, and both operate over industry standard HTTPS, protected by TLS.

See the [WhatsApp Encryption Overview technical whitepaper](https://www.whatsapp.com/security/WhatsApp-Security-Whitepaper.pdf) for additional details.

### Scaling

The Cloud API automatically scales usage within your rate limits.

### Rate limits

Requests made by your app on your WhatsApp Business Account (WABA) are counted against your app&#039;s request count. An app&#039;s request count is the number of requests it can make during a rolling one hour.

For the following endpoints, your app can make 200 requests per hour, per app, per WABA, by default. For active WABAs with at least one registered phone number, your app can make 5000 requests per hour, per app, per active WABA.

| Type of request | Endpoint |
| --- | --- |
| `GET` | `/&lt;WHATSAPP_BUSINESS_ACCOUNT_ID&gt;` |
| `GET`, `POST`, and `DELETE` | `/&lt;WHATSAPP_BUSINESS_ACCOUNT_ID&gt;/assigned_users` |
| `GET` | `/&lt;WHATSAPP_BUSINESS_ACCOUNT_ID&gt;/phone_numbers` |
| `GET`, `POST`, and `DELETE` | `/&lt;WHATSAPP_BUSINESS_ACCOUNT_ID&gt;/message_templates` |
| `GET`, `POST`, and `DELETE` | `/&lt;WHATSAPP_BUSINESS_ACCOUNT_ID&gt;/subscribed_apps` |
| `GET` | `/&lt;WHATSAPP_BUSINESS_ACCOUNT_TO_NUMBER_CURRENT_STATUS_ID&gt;` |

For the following [Credit Line API](https://developers.facebook.com/documentation/business-messaging/whatsapp/solution-providers/share-and-revoke-credit-lines) requests, your app can make 5000 requests per hour.

| Type of request | Endpoint |
| --- | --- |
| `GET` | `/&lt;BUSINESS_ID&gt;/extendedcredits` |
| `POST` | `/&lt;EXTENDED_CREDIT_ID&gt;/whatsapp_credit_sharing_and_attach` |
| `GET` and `DELETE` | `/&lt;ALLOCATION_CONFIG_ID&gt;` |
| `GET` | `/&lt;EXTENDED_CREDIT_ID&gt;/owning_credit_allocation_configs` |

For more information on how to get your current rate usage, see [Headers](https://developers.facebook.com/docs/graph-api/overview/rate-limiting#headers).


In addition, the platform applies several message rate limits:

* Test message rate limit (for unverified WABAs)
* Quality rating and messaging limits (for verified WABAs)
* Capacity rate limit (for all accounts)
* Business phone rate limit (per phone number)

#### Pair rate limits

Business phone numbers can send 1 message every 6 seconds to the same WhatsApp user (0.17 messages/second), which equals about 10 messages per minute or 600 per hour. Exceeding this limit triggers [error code 131056](https://developers.facebook.com/documentation/business-messaging/whatsapp/support/error-codes#throttling-errors) until you are back within the allowed rate.

You may send up to 45 messages in a 6-second burst, but this &quot;borrows&quot; from your future quota. After a burst, you must wait the equivalent time it would take to send those messages at the normal rate (for example, a burst of 20 requires a ~2-minute wait before sending more to that user).

To manage post-burst throttling, if a send request fails, retry after 4^X seconds (starting with X=0 and increasing X by 1 after each failure) until successful.

## Terms and policies

### User opt-in

You must obtain user [opt-in](https://developers.facebook.com/documentation/business-messaging/whatsapp/getting-opt-in) before sending message templates. Opt-in must clarify your business name and intent.

[Learn more about the WhatsApp Business Messaging Policy.](https://www.whatsapp.com/legal/business-policy/)

### Terms and policies

All WhatsApp Business Platform use must comply with our terms and policies. Using unauthorized third-party tools is prohibited.

- [Learn more about terms and policies.](https://whatsappbusiness.com/terms-and-conditions/)

## Next steps

[Get started with the WhatsApp Business Platform.](https://developers.facebook.com/documentation/business-messaging/whatsapp/get-started)

**Learn more**

* [Display names](https://developers.facebook.com/documentation/business-messaging/whatsapp/display-names)
* [Phone numbers](https://developers.facebook.com/documentation/business-messaging/whatsapp/business-phone-numbers/phone-numbers)
* [Pricing](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing)
* [Webhooks](https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/overview)
