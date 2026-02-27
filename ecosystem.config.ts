const config ={
    apps:[
        {
            name:"nextjs-app",
            script:".next/standalone/server.js",
            instances:"max",
            exec_mode:"cluster",
            env:{
                NODE_ENV:"production",
                PORT:3000,
            }
        }
    ]
};

module.exports=config;