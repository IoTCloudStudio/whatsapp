import { MessageType, MessageOptions, Mimetype, WAConnection,ReconnectMode } from '../src/WAConnection/WAConnection'
import * as fs from 'fs'

const params = process.argv.slice(2)

var file = params[0]
const XLSX = require('xlsx');
const workbook = XLSX.readFile(file); //'TestNode.xlsx
const sheet_name_list = workbook.SheetNames;

const client = new WAConnection()

client.autoReconnect = ReconnectMode.onConnectionLost
console.log(fs.existsSync('./auth_info.json') && client.loadAuthInfo ('./auth_info.json'))

// connect or timeout in 60 seconds
client.connectOptions.timeoutMs = 60*1000
// attempt to reconnect at most 10 times
client.connectOptions.maxRetries = 10

client.connect() // will load JSON credentials from file
.then (user => {
    
    //const authInfo = client.base64EncodedAuthInfo() // get all the auth info we need to restore this session
    //fs.writeFileSync('./auth_info.json', JSON.stringify(authInfo, null, '\t')) // save this info to a file
    
    sheet_name_list.forEach(async function(y){
        var XL_row_object = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[y])
        for(var i = 0; i < XL_row_object.length; i++){
            var nombre = XL_row_object[i].NOMBRE + ' ' +XL_row_object[i].APELLIDO

            var msg = ` Sr./a: ${ nombre },

            En esta ocasión nos contactamos desde JOIN Tech para recordarle la información de uso del sistema de Seguridad para edificios con monitoreo las 24hs adquirido por su consorcio con domicilio en PARAGUAY 1408.`
            
            var msg2 = ` Por reclamos técnicos o desperfectos la guardia técnica lo atenderá al 0341 - 4498077.

            Le agradecemos por su tiempo y le pedimos que ante cualquier duda se comunique con nosotros.` 

            console.log(await client.sendMessage ('549'+XL_row_object[i].CEL+'@s.whatsapp.net', msg , MessageType.text))

            const buffer = fs.readFileSync("manual1.jpg") // load some gif
            const options: MessageOptions = {mimetype: Mimetype.jpeg, caption: ''} // some metadata & caption
            console.log(await client.sendMessage('549'+XL_row_object[i].CEL+'@s.whatsapp.net', buffer, MessageType.image, options))

            const buffer2 = fs.readFileSync("manual2.jpg") // load some gif
            const options2: MessageOptions = {mimetype: Mimetype.jpeg, caption: ''} // some metadata & caption
            console.log(await client.sendMessage('549'+XL_row_object[i].CEL+'@s.whatsapp.net', buffer2, MessageType.image, options2))


            const buffer3 = fs.readFileSync("manual3.jpg") // load some gif
            const options3: MessageOptions = {mimetype: Mimetype.jpeg, caption: ''} // some metadata & caption
            console.log(await client.sendMessage('549'+XL_row_object[i].CEL+'@s.whatsapp.net', buffer3, MessageType.image, options3))

            console.log(await client.sendMessage ('549'+XL_row_object[i].CEL+'@s.whatsapp.net', msg2 , MessageType.text))
        }
    })
}).catch()