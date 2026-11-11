import {config} from './config.js';
import {getOrderByCode,listAllOrders,updateOrderStatus,orderStatuses} from './db.js';

const money=n=>new Intl.NumberFormat('uk-UA',{style:'currency',currency:'UAH',maximumFractionDigits:0}).format(n);
const esc=s=>String(s??'').replace(/[<>&]/g,c=>({'<':'&lt;','>':'&gt;','&':'&amp;'}[c]));
const SITE='https://mmw-company.onrender.com';
const BOT_USERNAME=String(config.telegramBotUsername||'').replace(/^@/,'');
const BOT_URL=BOT_USERNAME ? 'https://t.me/'+BOT_USERNAME : '';

async function tg(method,body){
  const token=String(config.telegramBotToken||'').trim();
  if(!token)throw new Error('TELEGRAM_BOT_TOKEN не настроен');
  const r=await fetch(`https://api.telegram.org/bot${token}/${method}`,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
  const data=await r.json().catch(()=>({}));
  if(!r.ok||!data.ok)throw new Error(data.description||`Telegram HTTP ${r.status}`);
  return data.result;
}

function allowed(chatId){return String(chatId)===String(config.telegramChatId||'').trim();}
function adminHelp(){return 'MMW-COMPANY · АДМИНИСТРАТИВНЫЕ КОМАНДЫ\n\n/orders — последние заявки\n/find 12345 — найти заявку по 5-значному коду\n/status 12345 В работе — изменить статус\n/health — состояние каналов';}
function publicKeyboard(){return {inline_keyboard:[
  [{text:'Официальный сайт',url:SITE},{text:'О компании',url:SITE+'/#method'}],
  [{text:'Проекты',url:SITE+'/#projects'},{text:'Каталог',url:SITE+'/catalog.html'}],
  [{text:'Сообщество',url:SITE+'/feedback.html'},{text:'Карьера',url:SITE+'/careers.html'}],
  [{text:'Личный кабинет',url:SITE+'/account.html'},{text:'Правовые документы',url:SITE+'/legal.html'}],
  [{text:'Приложение',url:SITE+'/android.html'},{text:'Связаться',url:SITE+'/#contact'}],
  [{text:'Instagram',url:'https://instagram.com/_mmwcompany'},{text:'Facebook',url:'https://www.facebook.com/1451024248083457'}],
  [{text:'Написать на email',url:'mailto:mmw.company28@gmail.com'}]
]};}
function publicInfo(){return 'MMW-COMPANY — бренд и проектно-ориентированная инициатива, используемые для представления проектных концепций, направлений развития и возможностей профессионального сотрудничества. Само использование бренда не подтверждает отдельную организационно-правовую форму, регистрацию бизнеса или владение объектами.\n\nНа официальном сайте представлены шесть проектных концепций: ALADIN RESIDENCE, NEXUS WORK, CARPATHIA ECO LODGE, AGROHUB, ENERGY PARK и NEXUS LOGISTICS. Дополнительно доступны десять направлений каталога и 26 активных форматов. Это структура концепций и каталога, а не заявление о количестве реализованных объектов или действующих контрактов.\n\nНа сайте также доступны информация о компании и методологии, каталог, сообщество, карьера и профессиональные обращения, коммерческие формы и личный кабинет.\n\nЭтот бот предназначен для справочной информации и навигации по официальным ресурсам. Бот не принимает заказы и не заменяет коммерческие формы сайта. Отправка сообщения боту не означает заключение договора или подтверждение заказа.\n\nДля коммерческого обращения используйте официальную форму: '+SITE+'/#contact. Правовая информация: '+SITE+'/legal.html. Информационный бот: '+(BOT_URL||'https://t.me/MMW_COMPANY_BOT')+'. Не отправляйте в Telegram пароли, пятизначные коды доступа, платёжные данные, копии документов или конфиденциальные материалы.\n\nВыберите нужный раздел ниже.';}
function orderText(o){return `ЗАЯВКА ${esc(o.id)}\nКод: ${esc(o.accessCode)}\nСтатус: ${esc(o.status)}\n\nКлиент: ${esc(o.customerName)}\nТелефон: ${esc(o.phone)}\nEmail: ${esc(o.email)}\nКомпания: ${esc(o.company||'—')}\nТип проекта: ${esc(o.projectType||'—')}\nАдрес: ${esc(o.address||'—')}\n\nЗАКАЗ\n${o.items.map(i=>`• ${esc(i.name)} × ${i.qty} — ${money(i.price*i.qty)}`).join('\n')}\n\nИТОГО: ${money(o.total)}\nКомментарий: ${esc(o.comment||'—')}`;}

export async function handleTelegramUpdate(update){
  const msg=update?.message;
  if(!msg?.chat?.id||!msg.text)return {ok:true,ignored:true};
  const chatId=msg.chat.id;
  const text=msg.text.trim();
  const publicCommand=text.match(/^\/(start|help|site|company|projects|catalog|community|contact|legal|careers|account|app)(@\w+)?$/i);
  if(publicCommand){
    const command=publicCommand[1].toLowerCase();
    const responses={
      start:publicInfo(),help:publicInfo(),
      site:'Официальный сайт MMW-COMPANY: '+SITE,
      company:'Информация о компании и методологии: '+SITE+'/#method',
      projects:'Проектные концепции MMW-COMPANY: '+SITE+'/#projects',
      catalog:'Каталог направлений: '+SITE+'/catalog.html',
      community:'Отзывы и сообщество: '+SITE+'/feedback.html',
      contact:'Связь с MMW-COMPANY:\nEmail: mmw.company28@gmail.com\nInstagram: https://instagram.com/_mmwcompany\nFacebook: https://www.facebook.com/1451024248083457\nTelegram: '+(BOT_URL||'https://t.me/MMW_COMPANY_BOT')+'\nWhatsApp пока не подключён. Для отправки обращения используйте форму: '+SITE+'/#contact',
      legal:'Правовые документы и условия: '+SITE+'/legal.html',
      careers:'Карьера и профессиональное сотрудничество: '+SITE+'/careers.html',
      account:'Личный кабинет MMW-COMPANY: '+SITE+'/account.html',
      app:'Информация о приложении MMW-COMPANY: '+SITE+'/android.html'
    };
    await tg('sendMessage',{chat_id:chatId,text:responses[command],...(command==='start'||command==='help'?{reply_markup:publicKeyboard(),disable_web_page_preview:true}:{})});
    return {ok:true,public:true};
  }
  if(!allowed(chatId)){
    await tg('sendMessage',{chat_id:chatId,text:'Этот бот предназначен для справочной информации и перехода к официальным ресурсам MMW-COMPANY. Для заявки используйте форму на сайте: '+SITE+'/#contact',disable_web_page_preview:true});
    return {ok:false,forbidden:true};
  }
  if(/^\/health$/i.test(text)){
    const h={email:Boolean(config.resendApiKey&&config.resendFrom&&config.adminEmail),telegram:Boolean(config.telegramBotToken&&config.telegramChatId),database:Boolean(config.databaseUrl)};
    await tg('sendMessage',{chat_id:chatId,text:`MMW-ORDER HEALTH\nEmail: ${h.email?'OK':'НЕ НАСТРОЕН'}\nTelegram: ${h.telegram?'OK':'НЕ НАСТРОЕН'}\nPostgreSQL: ${h.database?'OK':'НЕ НАСТРОЕН'}`});return {ok:true};
  }
  if(/^\/orders$/i.test(text)){
    const orders=await listAllOrders();
    const latest=orders.slice(0,10);
    const out=latest.length?latest.map(o=>`${o.id} | ${o.status} | ${money(o.total)} | код ${o.accessCode}`).join('\n'):'Заявок пока нет.';
    await tg('sendMessage',{chat_id:chatId,text:`ПОСЛЕДНИЕ ЗАЯВКИ\n\n${out}`});return {ok:true};
  }
  const find=text.match(/^\/find\s+(\d{5})$/i);
  if(find){const o=await getOrderByCode(find[1]);await tg('sendMessage',{chat_id:chatId,text:o?orderText(o):'Заявка с таким кодом не найдена.'});return {ok:true};}
  const st=text.match(/^\/status\s+(\d{5})\s+(.+)$/i);
  if(st){const o=await getOrderByCode(st[1]);if(!o){await tg('sendMessage',{chat_id:chatId,text:'Заявка не найдена.'});return {ok:true};}const status=st[2].trim();if(!orderStatuses.includes(status)){await tg('sendMessage',{chat_id:chatId,text:`Недопустимый статус. Доступны: ${orderStatuses.join(', ')}`});return {ok:true};}const updated=await updateOrderStatus(o.id,status);await tg('sendMessage',{chat_id:chatId,text:`Статус заявки ${updated.id} изменён на «${updated.status}».`});return {ok:true};}
  await tg('sendMessage',{chat_id:chatId,text:adminHelp()});return {ok:true};
}

export async function setTelegramWebhook(){
  if(!config.telegramBotToken||!config.publicBaseUrl)return {ok:false,error:'Не настроены TELEGRAM_BOT_TOKEN или PUBLIC_BASE_URL'};
  return tg('setWebhook',{url:`${config.publicBaseUrl.replace(/\/$/,'')}/api/telegram/webhook`});
}
