import { useEffect, useRef } from 'react';
import showImageCss from './ShowImage.module.css'
import { positionSelect } from '../../utils/positionSelect';
let lastUrl = ""
export function ShowImage({ employee, url }) {
    const selectEmployee = useRef(null);
    const imageRef = useRef(null);

    useEffect(() => {
        if (lastUrl !== "") selectEmployee.current.classList.add(showImageCss.selecteEmployeeOpacity);
        lastUrl = url
    }, [url])

    const handleSelectPosition = () => {
        positionSelect(selectEmployee, imageRef, employee)
    }

    useEffect(() => {
        const load = setInterval(() => {
            const image = imageRef.current
            if (!image?.complete) return
            clearInterval(load)
            handleSelectPosition()
        }, 500);
    }, [employee])

    useEffect(() => {
        window.addEventListener("resize", handleSelectPosition)
        return () => {
            window.removeEventListener("resize", handleSelectPosition)
        }
    }, [])


    return (
        <>
            <div className={showImageCss.overflowImage}>
                <div>
                    <img ref={imageRef} src={url} width="100%" height="100%" style={{
                        transform: `rotate(-${employee?.pageAngle ?? 0}deg)`,
                    }} />
                </div>
            </div>

            <div className={showImageCss.selecteEmployee} ref={selectEmployee}></div>
        </>
    )
}
