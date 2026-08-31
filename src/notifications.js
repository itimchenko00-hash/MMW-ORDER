import {Resend} from 'resend';
import {config} from './config.js';
import {orderPdf} from './pdf.js';
const money=n=>new Intl.NumberFormat('uk-UA',{style:'currency',currency:'UAH',maximumFractionDigits:0}).format(n);

async function sendTelegram(text){
  const token=String(config.telegramBotToken||'').trim();
  const chatId=String(config.telegramChatId||'').trim();
  if(!token||!chatId){console.error('Telegram is not configured: TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID is missing');return {ok:false,error:'Telegram is not configured'};}
  try{
    const r=await fetch(`https://api.telegram.org/bot${token}/sendMessage`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({chat_id:chatId,text,disable_web_page_preview:true})});
    const data=await r.json().catch(()=>({}));
    if(!r.ok||data.ok!==true){const error=data?.description||`HTTP ${r.status}`;console.error('Telegram error:',error);return {ok:false,error};}
    return {ok:true,messageId:data?.result?.message_id||null};
  }catch(e){console.error('Telegram error:',e.message);return {ok:false,error:e.message};}
}

async function sendEmail(subject,text,to=config.adminEmail,attachments=[]){
  if(!config.resendApiKey||!config.resendFrom||!to){console.error('Email is not configured');return {ok:false,error:'Email is not configured'};}
  try{
    const result=await new Resend(config.resendApiKey).emails.send({from:config.resendFrom,to:Array.isArray(to)?to:[to],subject,text,attachments});
    if(result?.error){console.error('Resend error:',result.error);return {ok:false,error:result.error?.message||String(result.error)};}
    return {ok:true,id:result?.data?.id||null};
  }catch(e){console.error('Resend error:',e.message);return {ok:false,error:e.message};}
}

function accessUrl(o){return `${config.publicBaseUrl}/?order=${encodeURIComponent(o.id)}&code=${encodeURIComponent(o.accessCode)}`}

export async function notifyOrder(o){
 const url=accessUrl(o);
 const text=`НОВАЯ ЗАЯВКА MMW-ORDER\n\nНомер: ${o.id}\nКод клиента: ${o.accessCode}\nСсылка: ${url}\n\nКЛИЕНТ\nИмя: ${o.customerName}\nТелефон: ${o.phone}\nEmail: ${o.email}\nКомпания: ${o.company||'—'}\nТип проекта: ${o.projectType||'—'}\nАдрес: ${o.address||'—'}\n\nЗАКАЗ\n${o.items.map(i=>`• ${i.name} × ${i.qty} — ${money(i.price*i.qty)}`).join('\n')}\n\nИТОГО: ${money(o.total)}\nСтатус: ${o.status}\n\nКомментарий:\n${o.comment||'—'}`;
 const customer=`Ваша заявка ${o.id} принята.\n\nКод доступа: ${o.accessCode}\nОткрыть полную выписку: ${url}\n\nСтатус: ${o.status}\nСумма: ${money(o.total)}\n\nПолная выписка приложена к этому письму в формате PDF.\n\nMMW-ORDER`;
 let attachment=[];try{const pdf=await orderPdf(o);attachment=[{filename:`${o.id}.pdf`,content:pdf.toString('base64')}]}catch(e){console.error('PDF error:',e.message)}
 const [email,customerEmail,telegram]=await Promise.all([sendEmail(`Новая заявка ${o.id}`,text),sendEmail(`Выписка по заявке ${o.id} — MMW-ORDER`,customer,o.email,attachment),sendTelegram(text)]);
 return {email:email.ok,customerEmail:customerEmail.ok,telegram:telegram.ok,pdf:Boolean(attachment.length),telegramError:telegram.error||null,emailError:email.error||null,customerEmailError:customerEmail.error||null};
}

export async function notifyFeedback(p){
 const text=`ОБРАТНАЯ СВЯЗЬ MMW-ORDER\nИмя: ${p.name}\nКонтакт: ${p.contact}\n\n${p.message}`;
 const [email,telegram]=await Promise.all([sendEmail('Новое сообщение обратной связи — MMW-ORDER',text),sendTelegram(text)]);
 return {email:email.ok,telegram:telegram.ok,telegramError:telegram.error||null,emailError:email.error||null};
}

export async function sendTestNotifications(){
 const text=`ТЕСТ MMW-ORDER\n\nУведомления настроены.\nВремя: ${new Date().toLocaleString('uk-UA')}`;
 const [email,telegram]=await Promise.all([sendEmail('Тест уведомлений MMW-ORDER',text),sendTelegram(text)]);
 return {email:email.ok,telegram:telegram.ok,telegramError:telegram.error||null,emailError:email.error||null};
}
