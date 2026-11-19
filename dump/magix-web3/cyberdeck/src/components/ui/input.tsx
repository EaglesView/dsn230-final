const Input = ({className="",value="", onChange=()=>{},type="text",placeholder="FORGOT ABOUT ME",}) => {
    return (
        <input
            className={`${className} border-1 border-primary`}
            type={``}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            required={true}
            autoFocus={true}
            autoComplete={``}

        />
    ) ;
}

export default Input;