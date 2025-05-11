import { useEffect, useRef } from 'react';
import showImageCss from './ShowImage.module.css'
let lastUrl = ""
export function ShowImage({ employee, url }) {
    const selectEmployee = useRef(null);
    const imageRef = useRef(null);

    useEffect(() => {
        if (lastUrl !== "") selectEmployee.current.classList.add(showImageCss.selecteEmployeeOpacity);
        lastUrl = url
    }, [url])

    const handleSelectPosition = () => {
        const element = selectEmployee.current;
        const imageDimentions = imageRef.current.getBoundingClientRect();

        const porX = (employee.x / 2000) * 100;
        const porY = (employee.y / 2000) * 100;
        const porHeight = (employee.height / 2000) * 100;
        const porWidth = (employee.width / 2000) * 100;

        const positionX = imageDimentions.width * (porX / 100);
        const positionY = imageDimentions.height * (porY / 100);
        const width = imageDimentions.width * (porWidth / 100);
        const height = imageDimentions.height * (porHeight / 100);

        element.style.left = `${positionX}px`;
        element.style.top = `${positionY}px`;
        element.style.width = `${width}px`;
        element.style.height = `${height}px`;
        element.classList.remove(showImageCss.selecteEmployeeOpacity);
        element.classList.add(showImageCss.selecteEmployee);
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
