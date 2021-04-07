import { MessageType, MessageOptions, Mimetype, WAConnection,ReconnectMode } from '../src/WAConnection/WAConnection'
import * as fs from 'fs'

const params = process.argv.slice(2)

//var NAME_FILE = params[3];

var texto: any;

/*fs.readFile(NAME_FILE, 'utf8', function(err, data) {
//fs.readFile(NAME_FILE, 'utf8', function(err, data) {
    if (err) throw err;
    texto = data.split('CORTE-');
  });*/

var file = params[0]

//var direccion = params[1]+' '+params[2]

//var panico = params[1]

const client = new WAConnection()
const XLSX = require('xlsx');
const workbook = XLSX.readFile(file); //'TestNode.xlsx
const sheet_name_list = workbook.SheetNames;

client.autoReconnect = ReconnectMode.onConnectionLost
console.log(fs.existsSync('./auth_info.json') && client.loadAuthInfo ('./auth_info.json'))

// connect or timeout in 60 seconds
client.connectOptions.timeoutMs = 60*1000
// attempt to reconnect at most 10 times
client.connectOptions.maxRetries = 10


client.connect() // will load JSON credentials from file
.then (user => {
    sheet_name_list.forEach(async function(y){
        
        var XL_row_object = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[y])
        
        for(var i = 0; i < XL_row_object.length; i++){
            
            //var nombre = XL_row_object[i].NOMBRE + ' ' +XL_row_object[i].APELLIDO
            //var clave = XL_row_object[i].CLAVE
            var msg1 = `Estimado usuario: Nos comunicamos de JOIN-TECH, la empresa que administra y monitorea el sistema de control de acceso del edificio Pellegrini 563.` 
            var msg2 = `El motivo de nuestro contacto es para informarle que a partir del día 1 de Abril del 2021 a las 00 hs. el servicio quedará suspendido por mora en el abono mensual y pago fuera de termino de los últimos 8 meses,  incumpliendo la cláusula octava del contrato vigente.` 
            var msg3 = `Esperando puedan regular la situación y ofreciendo nuestras disculpas por las molestias ocasionadas. Los saludamos Atte. Este mensajes es solo informativo, no responder el mismo.`;

            console.log(await client.sendMessage ('549'+XL_row_object[i].CEL+'@s.whatsapp.net', msg1 , MessageType.text))
            console.log(await client.sendMessage ('549'+XL_row_object[i].CEL+'@s.whatsapp.net', msg2 , MessageType.text))
            console.log(await client.sendMessage ('549'+XL_row_object[i].CEL+'@s.whatsapp.net', msg3 , MessageType.text))
            
            /*for(var j = 0; j < texto.length; j++){
                msg = texto[j];
                if(msg.indexOf('${ nombre }') > 0){
                    msg = msg.replace('${ nombre }',nombre)
                }
                if(texto[j].indexOf('${ direccion }') > 0){
                    msg = msg.replace('${ direccion }',direccion)
                }
                if(msg.indexOf('${ CLAVE }') > 0){
                    msg = msg.replace('${ CLAVE }',clave)
                }
                if(msg.indexOf('${ CLAVE_PANICO }') > 0){
                    msg = msg.replace('${ CLAVE_PANICO }',panico)
                }
                
                await client.sendMessage ('549'+XL_row_object[i].CEL+'@s.whatsapp.net', texto[i] , MessageType.text)
                //console.log(await client.sendMessage ('5493413261012@s.whatsapp.net', msg , MessageType.text))
            }*/
            
            /*var msg1 = ` Sr./a: ${ nombre },

            JOIN Tech le da la bienvenida al nuevo sistema de Seguridad para edificios con monitoreo las 24hs adquirido por su consorcio con domicilio en ${ direccion }.
            
            El Hall de su edificio se encuentra protegido y monitoreado por nuestra central remotamente. Ante cualquier evento que ocurra en el mismo un operador procederá a comunicarse con usted para controlar que todo este bien. Luego de informarle lo ocurrido se le requerirá una palabra clave, en su caso es “${ XL_row_object[i].CLAVE }” la misma que para los otros convivientes en su departamento. Por favor comuníquele esta clave a las personas que usted autorizo a poseer llaves.`;

            var msg2 = `En caso de encontrarse ante una amenaza cuando el operador requiera la palabra clave puede brindar “${ params[1] }” el cual le hará saber que se encuentra en una situación de riesgo.
            Este mensaje sirve ademas para corroborar que su teléfono se encuentre correctamente en nuestra base de datos.Se considera que esta información es correcta responda este mensaje con un OK caso contrario informenos el error al 341 4498077.
            
            Muchas gracias!`

            var msg3 = `Este mensaje sirve ademas para corroborar que su telefono se encuentre correctamente en nuestra base de datos. Se considera que esta información es correcta responda este mensaje con un OK caso contrario informenos el error al 341 4498077.
            
            Muchas gracias!`*/
            
            //console.log(await client.sendMessage ('549'+XL_row_object[i].CEL+'@s.whatsapp.net', msg1 , MessageType.text))
            //console.log(await client.sendMessage ('549'+XL_row_object[i].CEL+'@s.whatsapp.net', msg2 , MessageType.text))
            
            //console.log(await client.sendMessage ('549'+XL_row_object[i].CEL+'@s.whatsapp.net', msg3 , MessageType.text))
            //console.log(client.sendMessage ('5493415311043@s.whatsapp.net', msg1 , MessageType.text))
            //console.log(client.sendMessage ('5493415311043@s.whatsapp.net', msg2 , MessageType.text))
            //console.log(client.sendMessage ('5493415311043@s.whatsapp.net', msg3 , MessageType.text))
        }
    })
}).catch()