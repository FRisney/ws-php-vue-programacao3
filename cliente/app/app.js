const app = Vue.createApp({
    template: `<div class="bg-slate-700 md:px-28 xl:px-96 md:py-16 xl:py-32 h-screen flex flex-col">
        <div class="bg-slate-300 rounded-t-xl px-4 py-6 grid grid-cols-3 justify-items-center">
            <span class="justify-self-start" v-on:click="changeTo">Voltar</span>
            <div class="text-center text-xl font-bold">Chat Programação III</div>
            <span class="text-right justify-self-end">{{nome}}</span>
         </div>
        <div id="main" class="bg-white grow flex flex-col items-center justify-center">
            <div v-if="!registerSent" class="flex flex-col gap-8">
                <input class="grow rounded-md p-4 h-16 border rounded-xl" v-model="nome" type="text" placeholder="digite seu nome">
                <button class="p-4 rounded-md bg-blue-300" v-on:click="register">Registrar</button>
            </div>
            <div v-else-if="sel == null" class="flex flex-col gap-8">
                <select v-model="sel" class="p-4 h-16 w-56 rounded-xl">
                    <option v-bind:value="contato" v-for="contato in contatos">{{contato}}</option>
                </select>
            </div>
            <div v-else class="grow overflow-scroll flex flex-col self-stretch">
                <ul>
                    <li v-for="message in mensagens">
                        <div v-if="message.type == 'sent'" class="px-4 py-2 flex flex-row items-center justify-end gap-4">
                            <div id="txt" class="p-4 bg-blue-100 rounded-md">{{message.text}}</div>
                            <div id="avatar" class="w-12 h-12 bg-blue-600 rounded-full"></div>
                        </div>
                        <div v-else class="px-4 py-2 flex flex-row items-center justify-start gap-4">
                            <div id="avatar" class="w-12 h-12 bg-red-600 rounded-full"></div>
                            <div id="txt" class="p-4 bg-red-100 rounded-md">{{message.text}}</div>
                        </div>
                    </li>
                </ul>
            </div>
        </div>
        <div id="foot" class="bg-slate-200 rounded-b-xl p-4 flex flex-row gap-4 grow-0">
            <input class="grow rounded-md p-4" v-model="text" type="text" placeholder="Escreva sua mensagem aqui...">
            <button class="grow-0 rounded-md p-4 bg-green-500 text-white font-bold" v-on:click="send">Enviar</button>
        </div>
    </div>`,
    data() {
        return {
            mensagens: [],
            contatos:[],
            connection: null,
            text: null,
            nome:null,
            sel:null,
            registerSent: false,
        }
    },
    created() {
        this.connection = new WebSocket('ws://localhost:7777');
        this.listen()
    },
    computed:{
        bootstrapped(){
            let ret = this.sel != null && this.nome != null && this.registerSent;
            console.log(ret);
            return ret;
        },
        initials(){
            let arr = this.sel.split(' ');
            let ret = arr[0].toUpperCase();
            if (arr.length > 1){
                ret += arr[1].toUpperCase();
            }
            return ret;
        }
    },
    methods: {
        changeTo(){
            this.sel = null;
            this.mensagens = [];
        },
        register(){
            let msg = { 'reason':'contacts' };
            this.connection.send(JSON.stringify(msg));
            msg = {
                'reason':'register',
                'name':this.nome,
            };
            console.log(msg);
            this.connection.send(JSON.stringify(msg));
            this.registerSent = true;
        },
        send() {
            let msg = {
                'reason':'dm',
                'from':this.nome,
                'to':this.sel,
                'text':this.text,
            };
            console.log(msg);
            this.connection.send(JSON.stringify(msg));
            this.mensagens.push({'type':'sent', 'text': this.text});
            this.text = '';
        },
        listen() {
            this.connection.addEventListener('message', message => {
                let data = JSON.parse(message.data);
                if (data.hasOwnProperty('reason')){
                    console.log(data);
                    switch (data.reason) {
                        case 'contacts':
                            this.contatos = data.contatos.filter(e => e !== this.nome);
                            break;
                        case 'dm':
                            console.log(data.text);
                            if (this.sel !== data.from) break;
                            this.mensagens.push({'type':'received', 'text': data.text});
                            break;
                        default:
                            console.log('Listen Failed');
                    }
                }
            });
        }
    }
})
app.mount('#app')