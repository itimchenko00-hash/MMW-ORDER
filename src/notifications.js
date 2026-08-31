import {Resend} from 'resend';
import {config} from './config.js';
const money=n=>new Intl.NumberFormat('uk-UA',{style:'currency',currency:'UAH',maximumFractionDigits:0}).format(n);
async function sendTelegram(text){if(!config.telegramBotToken||!config.telegramChatId)return false;try{const r=await fetch(`https://api.telegram.org/bot${config.telegramBotToken}/sendMessage`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({chat_id:config.telegramChatId,text,disable_web_page_preview:true})});return r.ok}catch(e){console.error(e.message);return false}}
async function sendEmail(subject,text,to=config.adminEmail){if(!config.resendApiKey||!config.resendFrom||!to)return false;try{await new Resend(config.resendApiKey).emails.send({from:config.resendFrom,to:Array.isArray(to)?to:[to],subject,text});return true}catch(e){console.error(e.message);return false}}
function accessUrl(o){return `${config.publicBaseUrl}/?order=${encodeURIComponent(o.id)}&code=${encodeURIComponent(o.accessCode)}`}
export async function notifyOrder(o){
 const text=`Новая заявка ${o.id}\nКод доступа клиента: ${o.accessCode}\nПросмотр: ${accessUrl(o)}\n\nКлиент: ${o.customerName}\nТелефон: ${o.phone}\nEmail: ${o.email}\nКомпания: ${o.company||'—'}\nТип: ${o.projectType||'—'}\nАдрес: ${o.address||'—'}\n\n${o.items.map(i=>`• ${i.name} × ${i.qty} — ${money(i.price*i.qty)}`).join('\n')}\n\nИТОГО: ${money(o.total)}\nКомментарий: ${o.comment||'—'}`;
 const customer=`Ваша заявка ${o.id} принята.\n\nКод доступа: ${o.accessCode}\nОткрыть заявку: ${accessUrl(o)}\n\nСохраните номер заявки и 5-значный код — они нужны для просмотра полной информации о заказе.\nСтатус: ${o.status}\nСумма: ${money(o.total)}\n\nMMW-ORDER`;
 return {email:await sendEmail(`Новая заявка ${o.id}`,text),customerEmail:await sendEmail(`Ваша заявка ${o.id} — MMW-ORDER`,customer,o.email),telegram:await sendTelegram(text)}
}
export async function notifyFeedback(p){const text=`Обратная связь MMW-ORDER\nИмя: ${p.name}\nКонтакт: ${p.contact}\n\nСообщение:\n${p.message}`;return {email:await sendEmail('Новое сообщение обратной связи — MMW-ORDER',text),telegram:await sendTelegram(text)}}
