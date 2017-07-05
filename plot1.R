library(dplyr)

fpath_file <- "exdata_2Fdata%2Fhousehold_power_consumption/household_power_consumption.txt"
df1<-read.csv(fpath_file, header=TRUE, sep=";", na.strings = "?")
df2<-subset(df1, Date %in% c("1/2/2007","2/2/2007"))
df2$Date<-as.Date(df2$Date, format="%d/%m/%Y")

dev.new(width=480, height=480)
plot1<-hist(df2$Global_active_power,main="Global Active Power", xlab="Global Active Power (kilowatts)", ylab = "Frequency", col="Red")
dev.copy(png, "plot1.png")
dev.off()