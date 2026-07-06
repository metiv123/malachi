# Pricing on the WhatsApp Business Platform


This document explains how pricing works on the WhatsApp Business Platform.

## Cloud API and Marketing Messages API for WhatsApp

Effective July 1, 2025, Meta charges on a **per-message basis**:

- You are only charged when a [template message](https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/overview) is delivered (`&quot;type&quot;:&quot;template&quot;`).
- Rates vary based on the template&#039;s [category](#message-template-categories) and the recipient WhatsApp phone number&#039;s [country calling code](#country-calling-codes).

Meta charges businesses in the following ways:

- All non-template messages are free (`&quot;type&quot;:&quot;text&quot;`, `&quot;type&quot;:&quot;image&quot;`, and so on). Non-template messages can only be sent within an open [customer service window](https://developers.facebook.com/documentation/business-messaging/whatsapp/messages/send-messages#customer-service-windows). See [Sending messages](https://developers.facebook.com/documentation/business-messaging/whatsapp/messages/send-messages#sending-messages) for a list of message types.
- Utility templates delivered within an open customer service window are free.
- You can unlock [lower rates](#volume-tiers) for utility and authentication template messages, based on messaging volume.
- All messages are free for 72 hours, including template messages, if sent within an open [free entry point window](#free-entry-point-windows).

## Pricing explainer

The pricing explainer PDF outlines how Meta charges businesses, in PDF form:

Pricing Explainer PDF

## Message template categories

Unlike non-template messages, template messages are the only message type that can be sent outside of a customer service window. Templates can be categorized as:

- Marketing
- Utility
- Authentication

See [Template categorization](https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/template-categorization) to learn how template categorization works.

### Template messages vs. non-template messages

- CSW = [Customer service window](https://developers.facebook.com/documentation/business-messaging/whatsapp/messages/send-messages#customer-service-windows)
- FEP = [Free entry point window](#free-entry-point-windows)

**Warning:** Businesses are responsible for reviewing the category assigned to their approved templates. Whenever a template is used, a business accepts the charges associated with the category applied to the template at time of use.

## Charge example

In the example below, a business sends 4 messages to a WhatsApp user but is only charged for 2 (1 marketing charge, 1 utility charge).

| Hour | Action | Rate | Reason |
| --- | --- | --- | --- |
| 0 | You send a marketing template message to a WhatsApp user, promoting your new product. | Marketing | All marketing template messages are charged. |
| 2 | The user messages you about the product.&lt;br&gt;&lt;br&gt;This opens a 24 hour [customer service window](https://developers.facebook.com/documentation/business-messaging/whatsapp/messages/send-messages#customer-service-windows) (&quot;CSW&quot;). | - | Messages sent from a WhatsApp user to a business are not charged. |
| 3 | You send a [text message](https://developers.facebook.com/documentation/business-messaging/whatsapp/messages/text-messages) to the user (`&quot;type&quot;:&quot;text&quot;`), describing the product in more detail. | None | All non-template messages are free within an open customer service window. |
| 4 | The user purchases the product and you send them a utility template confirming their order. | None | The CSW is still open, and utility templates sent within an open CSW are free. |
| 26 | The CSW closes, which means you can no longer send non-template messages. | - | 24 hours have passed since the user last messaged you. |
| 30 | You send a utility template message to the user, updating them on their order. | Utility | Utility template messages sent outside of a CSW are charged, and no open CSW exists between you and the user. |

## Pricing calendar

To better enable our customers to plan and prepare for pricing updates, the following pricing calendar applies for messaging and voice on the WhatsApp Business Platform:

- Meta may update pricing only _on the 1st day of each quarter_, thus up to 4 times per year: January 1, April 1, July 1, and/or October 1.
- Meta will provide advanced notice that is better aligned to the effort required to implement different types of pricing updates, per below:

| Type of pricing update | Examples | Minimum advance notice |
| --- | --- | --- |
| **Rate card update** | Updating the [rate](#rates) for a given market–product&lt;br&gt;&lt;br&gt;Updating the volume tiers for a given market–product (utility and authentication only)&lt;br&gt;&lt;br&gt;Moving a market from one [pricing region](#country-calling-codes) (for example, &quot;Other&quot;) to another or to be standalone on the rate card | 1 month |
| **Pricing model add-on** | Our July 1, 2025, introduction of new [volume tiers](#volume-tiers) for utility and authentication messages | 3 months |
| **Pricing model change** | Our July 1, 2025 update to our pricing model, from conversation-based pricing to per-message pricing | 6 months |

## Rates

Rates vary based on [template category](https://developers.facebook.com/documentation/business-messaging/whatsapp/templates/template-categorization), [volume tier](#volume-tiers), and [country/region](#country-calling-codes) rate.

### Rate cards and volume tiers

These rate cards reflect our current rates and volume tiers, effective July 1, 2026, based on WhatsApp Business account timezone. This information is also available interactively on our [WhatsApp Business website](https://business.whatsapp.com/products/platform-pricing#rates).

| Currency | Rates(CSV) | Volume tiers(CSV) | Rates and Volume tiers(PDF) |
| --- | --- | --- | --- |
| USD | USD rates | USD volume tiers | USD rates and volume tiers |
| AED | AED rates | AED volume tiers | AED rates and volume tiers |
| ARS | ARS rates | ARS volume tiers | ARS rates and volume tiers |
| AUD | AUD rates | AUD volume tiers | AUD rates and volume tiers |
| BRL | BRL rates | BRL volume tiers | BRL rates and volume tiers |
| CLP | CLP rates | CLP volume tiers | CLP rates and volume tiers |
| COP | COP rates | COP volume tiers | COP rates and volume tiers |
| EUR | EUR rates | EUR volume tiers | EUR rates and volume tiers |
| GBP | GBP rates | GBP volume tiers | GBP rates and volume tiers |
| IDR | IDR rates | IDR volume tiers | IDR rates and volume tiers |
| INR | INR rates | INR volume tiers | INR rates and volume tiers |
| MXN | MXN rates | MXN volume tiers | MXN rates and volume tiers |
| MYR | MYR rates | MYR volume tiers | MYR rates and volume tiers |
| PEN | PEN rates | PEN volume tiers | PEN rates and volume tiers |
| SAR | SAR rates | SAR volume tiers | SAR rates and volume tiers |
| SGD | SGD rates | SGD volume tiers | SGD rates and volume tiers |

### Updates to rate cards

Below represents future updates to our rates. See our [rate cards](#rate-cards-and-volume-tiers) above for current rates.

#### Rate card updates effective October 1, 2026

To give customers more than 1-month notice – more time to plan and prepare – Meta is sharing pricing updates launching October 1, 2026 by June 1, 2026. Consistent with July 1, 2026, Meta will move additional markets out of their respective &quot;Rest Of&quot; pricing region to be standalone on rate cards. Below are at least the markets Meta will move out, and the corresponding updates to rates. Meta will announce to-be rates no later than September 1, 2026, per the [pricing calendar](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing#pricing-calendar).

- Bangladesh\*, Iraq\*, Nepal\*, Sri Lanka\* – Lower utility and authentication rates, plus a new authentication-international rate that is higher vs. the current regional authentication rate
- Kazakhstan\*, Kuwait\*, Morocco\*, Oman\*, Ukraine\* – Higher utility and authentication rates, plus a new authentication-international rate that is higher vs. the current regional authentication rate

#### Billing localization launches

**Brazil**

*Effective July 1, 2026, as of 9am PT* – Only partners and directly-integrated clients whose Sold-To country is Brazil in [Billing Hub](https://business.facebook.com/billing_hub/legal_entities) (eligible customers) can create new WhatsApp Business accounts (WABAs) in BRL (Brazilian Reals). Learn more about billing localization for Brazil [here](https://www.facebook.com/business/help/4344414845795884).

Per-message rates in BRL are now published [below](#updates-to-rate-cards). Charges from any BRL WABA will be invoiced in BRL by Meta&#039;s local entity in Brazil, Facebook Brasil.

As a reminder, eligible customers must ensure all WABAs in their business portfolio are migrated to BRL by June 30, 2027 to avoid disruptions, since as of July 1, 2027 Meta will no longer deliver the messages of non-BRL WABAs of eligible customers. To make this migration process easier and faster, use the [WABA Currency Migration APIs](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing/change-billing-currency), which are available as of June 1, 2026.

**India**

Billing localization launched on January 1, 2026 for partners and directly-integrated clients whose Sold-To country is India in [Billing Hub](https://business.facebook.com/billing_hub/legal_entities) (eligible customers). Learn more [here](https://www.facebook.com/business/help/2301408543603167).

Eligible customers must ensure all WABAs in their business portfolio are migrated to INR by December 31, 2026 to avoid disruptions, since as of January 1, 2027 Meta will no longer deliver the messages of non-INR WABAs of eligible customers. To make this migration process easier and faster, use the [WABA Currency Migration APIs](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing/change-billing-currency), which are available as of June 1, 2026.

#### Previous rate card updates

- Effective July 1, 2026 at 12am by WhatsApp Business account timezone, the rate updates below applied:
  - Hong Kong\* – Higher utility and authentication rates.
  - Hungary\* – Higher utility and authentication rates.
  - Italy – Higher marketing message rate.
  - Poland\* – Lower marketing, utility and authentication rates.
  - Qatar\* – Higher utility and authentication rates.
  - Romania\* – Higher utility and authentication rates.
  - Singapore\* – Higher utility and authentication rates.
  - Spain – Higher marketing message rate.
  - United Kingdom – Higher marketing message rate.

  \* Until June 30, 2026, messages to users in these markets were charged the respective regional rates (e.g., Rest of Central and Eastern Europe for Poland). These markets have been moved out of regional rate pricing to be standalone on rate cards, with market-specific rates.

  For utility and authentication messages – Volume tiers for these markets are now market-specific. For example, messages businesses send to users in Poland a/ no longer count toward the volume tiers of Rest of Central and Eastern Europe and instead b/ count toward the volume tiers of Poland.

- Effective April 1, 2026 at 12am by WhatsApp Business account timezone, the rate updates below applied:
  - Saudi Arabia – Higher marketing message rate.
  - India – Higher authentication-international rate.
  - Pakistan – Higher utility and authentication rates. No change to the authentication-international rate.
  - Turkey – Lower utility and authentication rates.
  - 8 new billing currencies introduced: ARS (Argentina), CLP (Chile), COP (Colombia), MYR (Malaysia), PEN (Peru), SAR (Saudi Arabia), SGD (Singapore), AED (United Arab Emirates).

- Effective January 1, 2026 at 12am by WhatsApp Business account timezone, the rate updates below applied:
  - India - Higher marketing rate.
  - France, Egypt - Lower marketing rates.
  - North America - Lower utility and authentication rates.

- Effective October 1, 2025 at 12am by WhatsApp Business account timezone, the rate updates below applied:
  - Colombia – Higher utility and authentication rates.
  - Mexico – Lower marketing rates.
  - United Arab Emirates – Higher marketing message rate.
  - Argentina, Egypt, Saudi Arabia – Lower utility and authentication rates.
  - Zimbabwe is mapped to our &quot;Rest of Africa&quot; region vs. &quot;Other&quot;. Messages delivered to WhatsApp users with a +263 country calling code (Zimbabwe) will be charged &quot;Rest of Africa&quot; rates.

- Effective July 1, 2025 – Lower utility and authentication message rates across several markets, to ensure pricing is on-par to alternate channels for these use cases. Marketing conversation rates became marketing message rates.
- Effective April 1, 2025 – Lowered [authentication-international conversation rates](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing/authentication-international-rates) for Egypt, Nigeria, Pakistan, and South Africa.
- Effective February 1, 2025 – Lowered [authentication conversation rates](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing#rates) for Egypt, Malaysia, Nigeria, Pakistan, Saudi Arabia, South Africa, and the United Arab Emirates.
- Effective November 1, 2024 – [Service conversations](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing/conversation-based-pricing#service-conversations) are now free for all businesses.
- Effective October 1, 2024 – Updated [marketing conversation rates](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing#rates) in India, Saudi Arabia, the United Arab Emirates, and the United Kingdom.
- Effective August 1, 2024 – Lowered [utility conversation rates](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing#rates).

### Authentication-international rates

Specific countries have an authentication-international rate. Our rate cards reflect these rates. See [Authentication-International rates](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing/authentication-international-rates) to learn about these rates and if they apply to you.

### Country calling codes

Charges for messages are based on the country calling code of the recipient WhatsApp phone number. The table below shows how Meta maps country calling codes and ISO 3166 Alpha-2 country codes to countries or regions. If a country is not listed below, it maps to **Other**.

| Markets | Calling Code&lt;br&gt;&lt;br&gt;(and network prefix if applicable) | ISO Country Code |
| --- | --- | --- |
| Countries&lt;br&gt;&lt;br&gt;Argentina&lt;br&gt;&lt;br&gt;Brazil&lt;br&gt;&lt;br&gt;Chile&lt;br&gt;&lt;br&gt;Colombia&lt;br&gt;&lt;br&gt;Egypt&lt;br&gt;&lt;br&gt;France&lt;br&gt;&lt;br&gt;Germany&lt;br&gt;&lt;br&gt;Hong Kong&lt;br&gt;&lt;br&gt;Hungary&lt;br&gt;&lt;br&gt;India&lt;br&gt;&lt;br&gt;Indonesia&lt;br&gt;&lt;br&gt;Israel&lt;br&gt;&lt;br&gt;Italy&lt;br&gt;&lt;br&gt;Malaysia&lt;br&gt;&lt;br&gt;Mexico&lt;br&gt;&lt;br&gt;Netherlands&lt;br&gt;&lt;br&gt;Nigeria&lt;br&gt;&lt;br&gt;Pakistan&lt;br&gt;&lt;br&gt;Peru&lt;br&gt;&lt;br&gt;Poland&lt;br&gt;&lt;br&gt;Qatar&lt;br&gt;&lt;br&gt;Romania&lt;br&gt;&lt;br&gt;Russia&lt;br&gt;&lt;br&gt;Saudi Arabia&lt;br&gt;&lt;br&gt;Singapore&lt;br&gt;&lt;br&gt;South Africa&lt;br&gt;&lt;br&gt;Spain&lt;br&gt;&lt;br&gt;Turkey&lt;br&gt;&lt;br&gt;United Arab Emirates&lt;br&gt;&lt;br&gt;United Kingdom | 54&lt;br&gt;&lt;br&gt;55&lt;br&gt;&lt;br&gt;56&lt;br&gt;&lt;br&gt;57&lt;br&gt;&lt;br&gt;20&lt;br&gt;&lt;br&gt;33&lt;br&gt;&lt;br&gt;49&lt;br&gt;&lt;br&gt;852&lt;br&gt;&lt;br&gt;36&lt;br&gt;&lt;br&gt;91&lt;br&gt;&lt;br&gt;62&lt;br&gt;&lt;br&gt;972&lt;br&gt;&lt;br&gt;39&lt;br&gt;&lt;br&gt;60&lt;br&gt;&lt;br&gt;52&lt;br&gt;&lt;br&gt;31&lt;br&gt;&lt;br&gt;234&lt;br&gt;&lt;br&gt;92&lt;br&gt;&lt;br&gt;51&lt;br&gt;&lt;br&gt;48&lt;br&gt;&lt;br&gt;974&lt;br&gt;&lt;br&gt;40&lt;br&gt;&lt;br&gt;7&lt;br&gt;&lt;br&gt;966&lt;br&gt;&lt;br&gt;65&lt;br&gt;&lt;br&gt;27&lt;br&gt;&lt;br&gt;34&lt;br&gt;&lt;br&gt;90&lt;br&gt;&lt;br&gt;971&lt;br&gt;&lt;br&gt;44 | AR&lt;br&gt;&lt;br&gt;BR&lt;br&gt;&lt;br&gt;CL&lt;br&gt;&lt;br&gt;CO&lt;br&gt;&lt;br&gt;EG&lt;br&gt;&lt;br&gt;FR&lt;br&gt;&lt;br&gt;DE&lt;br&gt;&lt;br&gt;HK&lt;br&gt;&lt;br&gt;HU&lt;br&gt;&lt;br&gt;IN&lt;br&gt;&lt;br&gt;ID&lt;br&gt;&lt;br&gt;IL&lt;br&gt;&lt;br&gt;IT&lt;br&gt;&lt;br&gt;MY&lt;br&gt;&lt;br&gt;MX&lt;br&gt;&lt;br&gt;NL&lt;br&gt;&lt;br&gt;NG&lt;br&gt;&lt;br&gt;PK&lt;br&gt;&lt;br&gt;PE&lt;br&gt;&lt;br&gt;PL&lt;br&gt;&lt;br&gt;QA&lt;br&gt;&lt;br&gt;RO&lt;br&gt;&lt;br&gt;RU&lt;br&gt;&lt;br&gt;SA&lt;br&gt;&lt;br&gt;SG&lt;br&gt;&lt;br&gt;ZA&lt;br&gt;&lt;br&gt;ES&lt;br&gt;&lt;br&gt;TR&lt;br&gt;&lt;br&gt;AE&lt;br&gt;&lt;br&gt;GB |
| North America&lt;br&gt;&lt;br&gt;Canada&lt;br&gt;&lt;br&gt;United States | 1&lt;br&gt;&lt;br&gt;1 | CA&lt;br&gt;&lt;br&gt;US |
| Rest of Africa&lt;br&gt;&lt;br&gt;Algeria&lt;br&gt;&lt;br&gt;Angola&lt;br&gt;&lt;br&gt;Benin&lt;br&gt;&lt;br&gt;Botswana&lt;br&gt;&lt;br&gt;Burkina Faso&lt;br&gt;&lt;br&gt;Burundi&lt;br&gt;&lt;br&gt;Cameroon&lt;br&gt;&lt;br&gt;Chad&lt;br&gt;&lt;br&gt;Republic of the Congo (Brazzaville)&lt;br&gt;&lt;br&gt;Eritrea&lt;br&gt;&lt;br&gt;Ethiopia&lt;br&gt;&lt;br&gt;Gabon&lt;br&gt;&lt;br&gt;Gambia&lt;br&gt;&lt;br&gt;Ghana&lt;br&gt;&lt;br&gt;Guinea-Bissau&lt;br&gt;&lt;br&gt;Ivory Coast&lt;br&gt;&lt;br&gt;Kenya&lt;br&gt;&lt;br&gt;Lesotho&lt;br&gt;&lt;br&gt;Liberia&lt;br&gt;&lt;br&gt;Libya&lt;br&gt;&lt;br&gt;Madagascar&lt;br&gt;&lt;br&gt;Malawi&lt;br&gt;&lt;br&gt;Mali&lt;br&gt;&lt;br&gt;Mauritania&lt;br&gt;&lt;br&gt;Morocco&lt;br&gt;&lt;br&gt;Mozambique&lt;br&gt;&lt;br&gt;Namibia&lt;br&gt;&lt;br&gt;Niger&lt;br&gt;&lt;br&gt;Rwanda&lt;br&gt;&lt;br&gt;Senegal&lt;br&gt;&lt;br&gt;Sierra Leone&lt;br&gt;&lt;br&gt;Somalia&lt;br&gt;&lt;br&gt;South Sudan&lt;br&gt;&lt;br&gt;Sudan&lt;br&gt;&lt;br&gt;Swaziland&lt;br&gt;&lt;br&gt;Tanzania&lt;br&gt;&lt;br&gt;Togo&lt;br&gt;&lt;br&gt;Tunisia&lt;br&gt;&lt;br&gt;Uganda&lt;br&gt;&lt;br&gt;Zambia&lt;br&gt;&lt;br&gt;Zimbabwe | 213&lt;br&gt;&lt;br&gt;244&lt;br&gt;&lt;br&gt;229&lt;br&gt;&lt;br&gt;267&lt;br&gt;&lt;br&gt;226&lt;br&gt;&lt;br&gt;257&lt;br&gt;&lt;br&gt;237&lt;br&gt;&lt;br&gt;235&lt;br&gt;&lt;br&gt;242&lt;br&gt;&lt;br&gt;291&lt;br&gt;&lt;br&gt;251&lt;br&gt;&lt;br&gt;241&lt;br&gt;&lt;br&gt;220&lt;br&gt;&lt;br&gt;233&lt;br&gt;&lt;br&gt;245&lt;br&gt;&lt;br&gt;225&lt;br&gt;&lt;br&gt;254&lt;br&gt;&lt;br&gt;266&lt;br&gt;&lt;br&gt;231&lt;br&gt;&lt;br&gt;218&lt;br&gt;&lt;br&gt;261&lt;br&gt;&lt;br&gt;265&lt;br&gt;&lt;br&gt;223&lt;br&gt;&lt;br&gt;222&lt;br&gt;&lt;br&gt;212&lt;br&gt;&lt;br&gt;258&lt;br&gt;&lt;br&gt;264&lt;br&gt;&lt;br&gt;227&lt;br&gt;&lt;br&gt;250&lt;br&gt;&lt;br&gt;221&lt;br&gt;&lt;br&gt;232&lt;br&gt;&lt;br&gt;252&lt;br&gt;&lt;br&gt;211&lt;br&gt;&lt;br&gt;249&lt;br&gt;&lt;br&gt;268&lt;br&gt;&lt;br&gt;255&lt;br&gt;&lt;br&gt;228&lt;br&gt;&lt;br&gt;216&lt;br&gt;&lt;br&gt;256&lt;br&gt;&lt;br&gt;260&lt;br&gt;&lt;br&gt;263 | DZ&lt;br&gt;&lt;br&gt;AO&lt;br&gt;&lt;br&gt;BJ&lt;br&gt;&lt;br&gt;BW&lt;br&gt;&lt;br&gt;BF&lt;br&gt;&lt;br&gt;BI&lt;br&gt;&lt;br&gt;CM&lt;br&gt;&lt;br&gt;TD&lt;br&gt;&lt;br&gt;CG&lt;br&gt;&lt;br&gt;ER&lt;br&gt;&lt;br&gt;ET&lt;br&gt;&lt;br&gt;GA&lt;br&gt;&lt;br&gt;GM&lt;br&gt;&lt;br&gt;GH&lt;br&gt;&lt;br&gt;GW&lt;br&gt;&lt;br&gt;CI&lt;br&gt;&lt;br&gt;KE&lt;br&gt;&lt;br&gt;LS&lt;br&gt;&lt;br&gt;LR&lt;br&gt;&lt;br&gt;LY&lt;br&gt;&lt;br&gt;MG&lt;br&gt;&lt;br&gt;MW&lt;br&gt;&lt;br&gt;ML&lt;br&gt;&lt;br&gt;MR&lt;br&gt;&lt;br&gt;MA&lt;br&gt;&lt;br&gt;MZ&lt;br&gt;&lt;br&gt;NA&lt;br&gt;&lt;br&gt;NE&lt;br&gt;&lt;br&gt;RW&lt;br&gt;&lt;br&gt;SN&lt;br&gt;&lt;br&gt;SL&lt;br&gt;&lt;br&gt;SO&lt;br&gt;&lt;br&gt;SS&lt;br&gt;&lt;br&gt;SD&lt;br&gt;&lt;br&gt;SZ&lt;br&gt;&lt;br&gt;TZ&lt;br&gt;&lt;br&gt;TG&lt;br&gt;&lt;br&gt;TN&lt;br&gt;&lt;br&gt;UG&lt;br&gt;&lt;br&gt;ZM&lt;br&gt;&lt;br&gt;ZW |
| Rest of Asia Pacific&lt;br&gt;&lt;br&gt;Afghanistan&lt;br&gt;&lt;br&gt;Australia&lt;br&gt;&lt;br&gt;Bangladesh&lt;br&gt;&lt;br&gt;Cambodia&lt;br&gt;&lt;br&gt;China&lt;br&gt;&lt;br&gt;Japan&lt;br&gt;&lt;br&gt;Laos&lt;br&gt;&lt;br&gt;Mongolia&lt;br&gt;&lt;br&gt;Nepal&lt;br&gt;&lt;br&gt;New Zealand&lt;br&gt;&lt;br&gt;Papua New Guinea&lt;br&gt;&lt;br&gt;Philippines&lt;br&gt;&lt;br&gt;Sri Lanka&lt;br&gt;&lt;br&gt;Taiwan&lt;br&gt;&lt;br&gt;Tajikistan&lt;br&gt;&lt;br&gt;Thailand&lt;br&gt;&lt;br&gt;Turkmenistan&lt;br&gt;&lt;br&gt;Uzbekistan&lt;br&gt;&lt;br&gt;Vietnam | 93&lt;br&gt;&lt;br&gt;61&lt;br&gt;&lt;br&gt;880&lt;br&gt;&lt;br&gt;855&lt;br&gt;&lt;br&gt;86&lt;br&gt;&lt;br&gt;81&lt;br&gt;&lt;br&gt;856&lt;br&gt;&lt;br&gt;976&lt;br&gt;&lt;br&gt;977&lt;br&gt;&lt;br&gt;64&lt;br&gt;&lt;br&gt;675&lt;br&gt;&lt;br&gt;63&lt;br&gt;&lt;br&gt;94&lt;br&gt;&lt;br&gt;886&lt;br&gt;&lt;br&gt;992&lt;br&gt;&lt;br&gt;66&lt;br&gt;&lt;br&gt;993&lt;br&gt;&lt;br&gt;998&lt;br&gt;&lt;br&gt;84 | AF&lt;br&gt;&lt;br&gt;AU&lt;br&gt;&lt;br&gt;BD&lt;br&gt;&lt;br&gt;KH&lt;br&gt;&lt;br&gt;CN&lt;br&gt;&lt;br&gt;JP&lt;br&gt;&lt;br&gt;LA&lt;br&gt;&lt;br&gt;MN&lt;br&gt;&lt;br&gt;NP&lt;br&gt;&lt;br&gt;NZ&lt;br&gt;&lt;br&gt;PG&lt;br&gt;&lt;br&gt;PH&lt;br&gt;&lt;br&gt;LK&lt;br&gt;&lt;br&gt;TW&lt;br&gt;&lt;br&gt;TJ&lt;br&gt;&lt;br&gt;TH&lt;br&gt;&lt;br&gt;TM&lt;br&gt;&lt;br&gt;UZ&lt;br&gt;&lt;br&gt;VN |
| Rest of Central and Eastern Europe&lt;br&gt;&lt;br&gt;Albania&lt;br&gt;&lt;br&gt;Armenia&lt;br&gt;&lt;br&gt;Azerbaijan&lt;br&gt;&lt;br&gt;Belarus&lt;br&gt;&lt;br&gt;Bulgaria&lt;br&gt;&lt;br&gt;Croatia&lt;br&gt;&lt;br&gt;Czech Republic&lt;br&gt;&lt;br&gt;Georgia&lt;br&gt;&lt;br&gt;Greece&lt;br&gt;&lt;br&gt;Latvia&lt;br&gt;&lt;br&gt;Lithuania&lt;br&gt;&lt;br&gt;Moldova&lt;br&gt;&lt;br&gt;North Macedonia&lt;br&gt;&lt;br&gt;Serbia&lt;br&gt;&lt;br&gt;Slovakia&lt;br&gt;&lt;br&gt;Slovenia&lt;br&gt;&lt;br&gt;Ukraine | 355&lt;br&gt;&lt;br&gt;374&lt;br&gt;&lt;br&gt;994&lt;br&gt;&lt;br&gt;375&lt;br&gt;&lt;br&gt;359&lt;br&gt;&lt;br&gt;385&lt;br&gt;&lt;br&gt;420&lt;br&gt;&lt;br&gt;995&lt;br&gt;&lt;br&gt;30&lt;br&gt;&lt;br&gt;371&lt;br&gt;&lt;br&gt;370&lt;br&gt;&lt;br&gt;373&lt;br&gt;&lt;br&gt;389&lt;br&gt;&lt;br&gt;381&lt;br&gt;&lt;br&gt;421&lt;br&gt;&lt;br&gt;386&lt;br&gt;&lt;br&gt;380 | AL&lt;br&gt;&lt;br&gt;AM&lt;br&gt;&lt;br&gt;AZ&lt;br&gt;&lt;br&gt;BY&lt;br&gt;&lt;br&gt;BG&lt;br&gt;&lt;br&gt;HR&lt;br&gt;&lt;br&gt;CZ&lt;br&gt;&lt;br&gt;GE&lt;br&gt;&lt;br&gt;GR&lt;br&gt;&lt;br&gt;LV&lt;br&gt;&lt;br&gt;LT&lt;br&gt;&lt;br&gt;MD&lt;br&gt;&lt;br&gt;MK&lt;br&gt;&lt;br&gt;RS&lt;br&gt;&lt;br&gt;SK&lt;br&gt;&lt;br&gt;SI&lt;br&gt;&lt;br&gt;UA |
| Rest of Western Europe&lt;br&gt;&lt;br&gt;Austria&lt;br&gt;&lt;br&gt;Belgium&lt;br&gt;&lt;br&gt;Denmark&lt;br&gt;&lt;br&gt;Finland&lt;br&gt;&lt;br&gt;Ireland&lt;br&gt;&lt;br&gt;Norway&lt;br&gt;&lt;br&gt;Portugal&lt;br&gt;&lt;br&gt;Sweden&lt;br&gt;&lt;br&gt;Switzerland | 43&lt;br&gt;&lt;br&gt;32&lt;br&gt;&lt;br&gt;45&lt;br&gt;&lt;br&gt;358&lt;br&gt;&lt;br&gt;353&lt;br&gt;&lt;br&gt;47&lt;br&gt;&lt;br&gt;351&lt;br&gt;&lt;br&gt;46&lt;br&gt;&lt;br&gt;41 | AT&lt;br&gt;&lt;br&gt;BE&lt;br&gt;&lt;br&gt;DK&lt;br&gt;&lt;br&gt;FI&lt;br&gt;&lt;br&gt;IE&lt;br&gt;&lt;br&gt;NO&lt;br&gt;&lt;br&gt;PT&lt;br&gt;&lt;br&gt;SE&lt;br&gt;&lt;br&gt;CH |
| Rest of Latin America&lt;br&gt;&lt;br&gt;Bolivia&lt;br&gt;&lt;br&gt;Costa Rica&lt;br&gt;&lt;br&gt;Dominican Republic&lt;br&gt;&lt;br&gt;Ecuador&lt;br&gt;&lt;br&gt;El Salvador&lt;br&gt;&lt;br&gt;Guatemala&lt;br&gt;&lt;br&gt;Haiti&lt;br&gt;&lt;br&gt;Honduras&lt;br&gt;&lt;br&gt;Jamaica&lt;br&gt;&lt;br&gt;Nicaragua&lt;br&gt;&lt;br&gt;Panama&lt;br&gt;&lt;br&gt;Paraguay&lt;br&gt;&lt;br&gt;Puerto Rico&lt;br&gt;&lt;br&gt;Uruguay&lt;br&gt;&lt;br&gt;Venezuela | 591&lt;br&gt;&lt;br&gt;506&lt;br&gt;&lt;br&gt;1 (809, 829, 849)&lt;br&gt;&lt;br&gt;593&lt;br&gt;&lt;br&gt;503&lt;br&gt;&lt;br&gt;502&lt;br&gt;&lt;br&gt;509&lt;br&gt;&lt;br&gt;504&lt;br&gt;&lt;br&gt;1 (658, 876)&lt;br&gt;&lt;br&gt;505&lt;br&gt;&lt;br&gt;507&lt;br&gt;&lt;br&gt;595&lt;br&gt;&lt;br&gt;1 (787, 939)&lt;br&gt;&lt;br&gt;598&lt;br&gt;&lt;br&gt;58 | BO&lt;br&gt;&lt;br&gt;CR&lt;br&gt;&lt;br&gt;DO&lt;br&gt;&lt;br&gt;EC&lt;br&gt;&lt;br&gt;SV&lt;br&gt;&lt;br&gt;GT&lt;br&gt;&lt;br&gt;HT&lt;br&gt;&lt;br&gt;HN&lt;br&gt;&lt;br&gt;JM&lt;br&gt;&lt;br&gt;NI&lt;br&gt;&lt;br&gt;PA&lt;br&gt;&lt;br&gt;PY&lt;br&gt;&lt;br&gt;PR&lt;br&gt;&lt;br&gt;UY&lt;br&gt;&lt;br&gt;VE |
| Rest of Middle East&lt;br&gt;&lt;br&gt;Bahrain&lt;br&gt;&lt;br&gt;Iraq&lt;br&gt;&lt;br&gt;Jordan&lt;br&gt;&lt;br&gt;Kuwait&lt;br&gt;&lt;br&gt;Lebanon&lt;br&gt;&lt;br&gt;Oman&lt;br&gt;&lt;br&gt;Yemen | 973&lt;br&gt;&lt;br&gt;964&lt;br&gt;&lt;br&gt;962&lt;br&gt;&lt;br&gt;965&lt;br&gt;&lt;br&gt;961&lt;br&gt;&lt;br&gt;968&lt;br&gt;&lt;br&gt;967 | BH&lt;br&gt;&lt;br&gt;IQ&lt;br&gt;&lt;br&gt;JO&lt;br&gt;&lt;br&gt;KW&lt;br&gt;&lt;br&gt;LB&lt;br&gt;&lt;br&gt;OM&lt;br&gt;&lt;br&gt;YE |
| Other&lt;br&gt;&lt;br&gt;All other countries | Varies by country |  |

## Volume tiers

You can unlock lower utility and authentication rates based on the number of messages you send in a month.

### Tiering accrual

- **Messages are aggregated at the business portfolio level, across all WhatsApp Business accounts (WABAs) owned by the portfolio** — To determine what tier rates may apply in a given month for a given market–category pair, Meta aggregates messages across all of a business portfolio&#039;s WABAs for each market-category pair (e.g., Brazil–authentication, Brazil–utility, India–authentication, and so on).
- **Only messages that are charged count toward the tiers** — Thus, the following messages do not count:
  - Utility templates delivered to WhatsApp users within an open customer service window.
   - Utility templates delivered within a [free entry point window](#free-entry-point-windows).
- **Volume tiers will be determined solely by Meta** — All insights data is approximate due to small variations in data processing. Undue reliance should not be placed on insights data.

### Key dynamics

- **Tiers are market–category specific** — Volume tiers are aligned to our rate cards and differ by market (e.g., Brazil or Rest of Latin America) and category (utility, authentication).
- **Rates are tier-specific** — When a business sends enough messages at a given market–category pair to reach the next tier, they unlock the rate of the next tier, specifically for messages in that tier. This rate applies across all of their WABAs.
- **Tiers reset monthly** — At the start of the next month (12am WABA timezone), message count resets to 0 and businesses begin to accrue messages toward that month.

### Volume tiers examples

The table below is illustrative and only highlights the dynamics of volume tiers. Please refer to our [rate cards](#rate-cards-and-volume-tiers) to see the rates charged.

Below are several examples to highlight how the tiers work and what is charged in a given month, for a given market–category. These examples refer to the illustrative table above:

Example 1: A business that sends a total of B authentication messages in a month to India is charged:

- List rate for the first A messages.
- Tier rate 1 for messages A+1 to B.
- Total charges for that month = Rate per tier 𝗑 messages in each tier.

Example 2: A business that starts to be charged our authentication-international rates on the 15th day of the month:

- Day 1 to 14 of that month: Volume tiers apply on the authentication rate.
- Day 15 onward of that month: Volume tiers apply on the authentication-international rate, with messages continuing to accrue in that month. For example, if a business has already reached the Tier 2, the business would be charged Tier 2&#039;s authentication-international rate:

Example 3: A business has 3 WABAs sending authentication messages to India. For WABA A, it is still July 31 based on their timezone. For WABAs B and C, it is already August 1 based on their timezone. For July, the business is already being charged Tier Rate 1.

- The business portfolio will be accruing toward tiers for both July (via WABA A) and August (via WABAs B, C) for a period of time.
- The business can reach the next tier for July, via WABA A. If that happens, messages for the remainder of July for WABA A will be charged Tier Rate 2.

Example 4: A business has 3 WABAs, integrated across 2 partners. Provider 1 sends the first B messages in a given month, and provider 2 starts sending messages as of when the business is in the 3rd tier. The business does not send enough messages that month to reach the next tier. What Meta charges each provider:

- Provider 1: List rate for A messages, then Tier Rate 1 from A+1 to B, and Tier Rate 2 for B+1 to C.
- Provider 2: Tier Rate 2 across all of their messages.

### Tiering webhooks

Starting October 1, 2025, an [account_update](https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/reference/account_update) webhook with `event` set to `VOLUME_BASED_PRICING_TIER_UPDATE` will be triggered when your WhatsApp Business account reaches a new volume tier, in any market, in a given month. This complements our [pricing_analytics](https://developers.facebook.com/documentation/business-messaging/whatsapp/analytics#pricing-analytics) endpoint, which will continue to provide intra-month tiering progress and tiering information for delivered messages.

Example webhook:

```json
&#123;
  &quot;object&quot;: &quot;whatsapp_business_account&quot;,
  &quot;entry&quot;: [
    &#123;
      &quot;id&quot;: &quot;102290129340398&quot;,
      &quot;time&quot;: 1743451903,
      &quot;changes&quot;: [
        &#123;
          &quot;value&quot;: &#123;
            &quot;volume_tier_info&quot;: &#123;
                &quot;tier_update_time&quot;: 1743451903,
                &quot;pricing_category&quot;: &quot;UTILITY&quot;,
                &quot;tier&quot;: &quot;25000001:50000000&quot;,
                &quot;effective_month&quot;: &quot;2025-11&quot;,
                &quot;region&quot;: &quot;India&quot;
            &#125;,
            &quot;event&quot;: &quot;VOLUME_BASED_PRICING_TIER_UPDATE&quot;
          &#125;,
          &quot;field&quot;: &quot;account_update&quot;
        &#125;
      ]
    &#125;
  ]
&#125;
```

- `tier_update_time` tells when your WABA reached a higher volume tier (Unix timestamp).
- `pricing_category` tells you the template category for which your new volume tier rate applies.
- `tier` tells you the new volume tier&#039;s lower and upper bounds.
- `effective_month` tells you the month in which your new volume tier rate is in effect.
- `region` tells you the WhatsApp user country/region for which your new volume tier rate applies.

Note that it&#039;s possible for multiple [account_update](https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/reference/account_update) webhooks to be triggered that describe the same tier switch event. In these cases, use the webhook with the smaller `tier_update_time` Unix timestamp as the official webhook.

### Tiering analytics

You can get [volume tier information](https://developers.facebook.com/documentation/business-messaging/whatsapp/analytics#volume-tier-information) via [template analytics](https://developers.facebook.com/documentation/business-messaging/whatsapp/analytics#template-analytics).

## Free non-template messages

Non-template messages, which can only be sent within an open [customer service window](https://developers.facebook.com/documentation/business-messaging/whatsapp/messages/send-messages#customer-service-windows), are free. These messages will have `type` set to `free_customer_service` in the `pricing` object of status [messages](https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/reference/messages/status) webhooks:

```json
&quot;pricing&quot;: &#123;
  &quot;billable&quot;: false,
  &quot;pricing_model&quot;: &quot;PMP&quot;,
  &quot;type&quot;: &quot;free_customer_service&quot;,
  &quot;category&quot;: &quot;service&quot;
&#125;
```

## Free utility template messages

Utility template messages sent within an open [customer service window](https://developers.facebook.com/documentation/business-messaging/whatsapp/messages/send-messages#customer-service-windows) are free. These messages will have `type` set to `free_customer_service` and `category` set to `utility` in the `pricing` object of status [messages](https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/reference/messages/status) webhooks:

```json
&quot;pricing&quot;: &#123;
  &quot;billable&quot;: false,
  &quot;pricing_model&quot;: &quot;PMP&quot;,
  &quot;type&quot;: &quot;free_customer_service&quot;,
  &quot;category&quot;: &quot;utility&quot;
&#125;
```

### Edge case

If you send a message to a WhatsApp user prior to July 1, 2025 (which is when Meta switched from conversation-based pricing to per-message pricing), a utility conversation is opened between you and a user that spans the switch to per-message pricing (the conversation was opened before the switch but won&#039;t close until after the switch). In this case, utility templates sent to the user after the switch while the conversation is open will be free, but attributed to the open conversation. In status [messages](https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/reference/messages/status) webhooks, these messages will have a `pricing_model` of `CBP` and the utility conversation ID will be assigned to `conversation.id`. Once the conversation closes, subsequent utility messages will use per-message pricing, which will be reflected in new webhooks.

## Free entry point windows

If a WhatsApp user messages you via a Click to WhatsApp Ad or Facebook Page Call-to-Action button using a device running our Android or iOS app (our desktop and web apps are not supported):

- A 24-hour [customer service window](https://developers.facebook.com/documentation/business-messaging/whatsapp/messages/send-messages#customer-service-windows) is opened (as normal).
- If you respond within 24 hours using any type of message, the message will be free, and a Free Entry Point (&quot;FEP&quot;) window will be opened, starting from the time when you responded.

FEP windows remain open for 72 hours. While open, you can send any type of message to the user at no charge. Note, however, that the customer service window is independent of the FEP window, so if the customer service window closes, you will only be able to send template messages.

## New max-price feature for Marketing Messages API for WhatsApp

Starting in 2026, businesses integrated into Marketing Messages API for WhatsApp can choose to set a [max-price](https://developers.facebook.com/documentation/business-messaging/whatsapp/marketing-messages/pricing) per marketing message delivery; when a max-price is set, Meta will charge that max-price or lower for delivery.

## New pricing policy for AI Providers leveraging WhatsApp Business Platform

Click [here](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing/ai-providers) to learn more about our new pricing policy for &quot;AI Providers&quot; leveraging WhatsApp Business Platform, which is effective February 16, 2026, and updated as of May 12, 2026.

## Analytics

Use the [pricing_analytics field](https://developers.facebook.com/documentation/business-messaging/whatsapp/analytics#pricing-analytics) to get per-message pricing breakdowns and tiering information for delivered messages.

## Webhooks

Billable messages have `type` set to `regular` in the `pricing` object of status [messages](https://developers.facebook.com/documentation/business-messaging/whatsapp/webhooks/reference/messages/status) webhooks:

```html
&quot;pricing&quot;: &#123;
  &quot;billable&quot;: true,
  &quot;pricing_model&quot;: &quot;PMP&quot;,
  &quot;type&quot;: &quot;regular&quot;,
  &quot;category&quot;: &quot;&lt;PRICING_CATEGORY&gt;&quot;
&#125;
```

The `&lt;PRICING_CATEGORY&gt;` tells you what rate was applied (for example, `marketing`). See the status messages webhook reference for a list of possible values.

Note that currently, tiering information is not included in any webhooks. Use the [pricing_analytics field](https://developers.facebook.com/documentation/business-messaging/whatsapp/analytics#pricing-analytics) to get tiering information for delivered messages.

## Billing

Billing and billing-related actions are handled through the Meta Business Suite. See [About Billing For Your WhatsApp Business Account](https://www.facebook.com/business/help/2225184664363779) for more information.

## WhatsApp Business Calling API pricing

The WhatsApp Business Calling API has different pricing. See our [Calling API pricing document](https://developers.facebook.com/documentation/business-messaging/whatsapp/calling/pricing) to learn more.

## Conversation-based pricing

[Conversation-based pricing](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing/conversation-based-pricing) is deprecated. It was replaced with per-message pricing on July 1, 2025.
